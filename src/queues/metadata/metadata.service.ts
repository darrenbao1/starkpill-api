import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { INDEX_METADATA, JOB_SETTINGS, METADATA_QUEUE } from '../constants';
import { getMetadataFromContract } from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from 'src/graphql/token/token.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { type } from 'os';

@Injectable()
export class MetadataService {
  constructor(
    @InjectQueue(METADATA_QUEUE) private readonly metadataQueue: Queue,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async queueGetMissingMetadata() {
    this.metadataQueue.clean(1000, 'failed');
    // find all the tokens that don't have metadata
    // and add them to the queue
    const presentTokenIdsPromise = this.prismaService.tokenMetadata
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // This is a superset of presentTokenIds as it is the source of truth of all tokens
    const allTokenIdsPromise = this.tokenService
      .findAllTokensForSourceOfTruth()
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // Run them concurrently as they are independent
    const [presentTokenIds, allTokenIds] = await Promise.all([
      presentTokenIdsPromise,
      allTokenIdsPromise,
    ]);

    const missingTokenIds = allTokenIds.filter(
      (token) => !presentTokenIds.includes(token),
    );
    const tokensToProcess = missingTokenIds.slice(0, 100);
    tokensToProcess.forEach((id) => this.queueIndexMetadata(id));
  }

  async queueGetAllMetadata() {
    const allTokenIds = (await this.tokenService.findAllTokens({})).map(
      (token) => token.id,
    );

    allTokenIds.forEach((id) => this.queueIndexMetadata(id));
  }

  async queueIndexMetadata(id: number) {
    console.log('queueIndexMetadata service');
    const waitingJobs = (await this.metadataQueue.getWaiting())
      .filter((job) => job.name === INDEX_METADATA)
      .map((job) => job.data) as number[];

    if (!waitingJobs.includes(id)) {
      this.metadataQueue.add(INDEX_METADATA, id, JOB_SETTINGS);
    }
  }

  // If an error is thrown, the job will be retried 3 times in total, then it will be moved to the failed queue
  async indexMetadata(id: number) {
    let metadata = await getMetadataFromContract(id);
    await this.prismaService.tokenMetadata.upsert({
      where: { id },
      create: {
        id: metadata.id,
        description: metadata.description,
        ingredient: metadata.ingredient,
        background: metadata.background,
        imageUrl: metadata.imageUrl,
        fame: metadata.fame,
        mintPrice: metadata.mintPrice.toString(),
      },
      update: {
        id: metadata.id,
        description: metadata.description,
        ingredient: metadata.ingredient,
        background: metadata.background,
        imageUrl: metadata.imageUrl,
        fame: metadata.fame,
        mintPrice: metadata.mintPrice.toString(),
      },
    });
  }

  async getTokenIdsWithNoMetaData() {
    // find all the tokens that don't have metadata
    // and add them to the queue
    const presentTokenIdsPromise = this.prismaService.tokenMetadata
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // This is a superset of presentTokenIds as it is the source of truth of all tokens
    const allTokenIdsPromise = this.tokenService
      .findAllTokensForSourceOfTruth()
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // Run them concurrently as they are independent
    const [presentTokenIds, allTokenIds] = await Promise.all([
      presentTokenIdsPromise,
      allTokenIdsPromise,
    ]);

    const missingTokenIds = allTokenIds.filter(
      (token) => !presentTokenIds.includes(token),
    );
    return missingTokenIds;
  }

  async getTokensIdsThatImageIsWrong() {
    const tokensIdsThatRequireRefresh: number[] = [];
    const allTokens = await this.tokenService.findAllTokensForSourceOfTruth();
    for (const token of allTokens) {
      const metadata = await this.prismaService.tokenMetadata.findUnique({
        where: { id: token.id },
      });
      //Get the actual Background Name
      let bgName = '';
      if (token.background == 0) {
        bgName = 'White';
      } else {
        const bg = await this.prismaService.backpackMetadata.findUnique({
          where: { id: token.background },
        });
        bgName = bg.itemName;
      }
      //Get the actual Ingredient Name
      let ingName = '';
      if (token.ingredient == 0) {
        ingName = 'Null';
      } else {
        const ing = await this.prismaService.backpackMetadata.findUnique({
          where: { id: token.ingredient },
        });
        console.log('ing', ing);
        ingName = ing.itemName;
      }
      if (metadata.background !== bgName || metadata.ingredient !== ingName) {
        tokensIdsThatRequireRefresh.push(token.id);
      }
    }
    return tokensIdsThatRequireRefresh;
  }

  // ?: It is preferable to use this method instead of running one contract call at a time as this is more efficient
  // ?: The problem is that it creates HTTP errors when too many requests are made at once
  // ?: One solution is to use a multicall contract to call multiple contract methods at once
  // async indexMultipleMetadata(tokenIds: number[]) {
  //   console.log('indexMultipleMetadata service');

  //   try {
  //     const metadata = await Promise.all(
  //       tokenIds.map((tokenId) => getMetadataFromContract(tokenId)),
  //     );

  // Needs to be batched into a transaction so that it is atomic
  //     this.prismaService.$transaction([
  //       this.prismaService.tokenMetadata.deleteMany({
  //         where: { id: { in: tokenIds } },
  //       }),
  //       this.prismaService.tokenMetadata.createMany({ data: metadata }),
  //     ]);

  //     console.log(metadata);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
}
