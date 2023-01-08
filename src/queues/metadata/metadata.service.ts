import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { INDEX_METADATA, JOB_SETTINGS, METADATA_QUEUE } from '../constants';
import { getMetadataFromContract } from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from 'src/graphql/token/token.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MetadataService {
  constructor(
    @InjectQueue(METADATA_QUEUE) private readonly metadataQueue: Queue,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async queueGetMissingMetadata() {
    // find all the tokens that don't have metadata
    // and add them to the queue
    const presentTokenIdsPromise = this.prismaService.tokenMetadata
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // This is a superset of presentTokenIds as it is the source of truth of all tokens
    const allTokenIdsPromise = this.tokenService
      .findAllTokens({})
      .then((tokenIds) => tokenIds.map((token) => token.id));

    // Run them concurrently as they are independent
    const [presentTokenIds, allTokenIds] = await Promise.all([
      presentTokenIdsPromise,
      allTokenIdsPromise,
    ]);

    const missingTokenIds = allTokenIds.filter(
      (token) => !presentTokenIds.includes(token),
    );

    missingTokenIds.forEach((id) => this.queueIndexMetadata(id));
  }

  async queueGetAllMetadata() {
    const allTokenIds = (await this.tokenService.findAllTokens({})).map(
      (token) => token.id,
    );

    allTokenIds.forEach((id) => this.queueIndexMetadata(id));
  }

  async queueIndexMetadata(id: number) {
    const waitingJobs = (await this.metadataQueue.getWaiting())
      .filter((job) => job.name === INDEX_METADATA)
      .map((job) => job.data) as number[];

    if (!waitingJobs.includes(id)) {
      this.metadataQueue.add(INDEX_METADATA, id, JOB_SETTINGS);
    }
  }

  // If an error is thrown, the job will be retried 3 times in total, then it will be moved to the failed queue
  async indexMetadata(id: number) {
    const metadata = await getMetadataFromContract(id);
    console.log(metadata, id);

    await this.prismaService.tokenMetadata.upsert({
      where: { id },
      create: metadata,
      update: metadata,
    });
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
