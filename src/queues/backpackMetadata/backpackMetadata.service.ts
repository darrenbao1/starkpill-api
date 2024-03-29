import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BACKPACK_QUEUE, INDEX_BACKPACK, JOB_SETTINGS } from '../constants';
import { getBackpackFromContract } from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BackpackMetadataService {
  constructor(
    @InjectQueue(BACKPACK_QUEUE) private readonly backpackQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async queueGetMissingMetadata() {
    this.backpackQueue.clean(1000, 'failed');
    // find all the tokens that don't have metadata
    // and add them to the queue
    const presentTokenIdsPromise = this.prismaService.backpackMetadata
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.id));
    // This is a superset of presentTokenIds as it is the source of truth of all tokens
    const allTokenIdsPromise = this.prismaService.knownTraits
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.tokenId));
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
    // const allTokenIds = (await this.tokenService.findAllTokens({})).map(
    // (token) => token.id,
    // );
    // allTokenIds.forEach((id) => this.queueIndexMetadata(id));
  }

  async queueIndexMetadata(id: number) {
    //check if backpackMetadata already exist in db
    const backpackMetadata =
      await this.prismaService.backpackMetadata.findUnique({
        where: { id },
      });
    if (backpackMetadata) {
      console.log('backpack metadata already exist in db');
      return;
    }
    console.log('backpack metadata service');
    const waitingJobs = (await this.backpackQueue.getWaiting())
      .filter((job) => job.name === INDEX_BACKPACK)
      .map((job) => job.data) as number[];

    if (!waitingJobs.includes(id)) {
      this.backpackQueue.add(INDEX_BACKPACK, id, JOB_SETTINGS);
    }
  }
  // If an error is thrown, the job will be retried 3 times in total, then it will be moved to the failed queue
  async indexMetadata(id: number) {
    const backpackMetadata = await getBackpackFromContract(id);
    await this.prismaService.backpackMetadata.upsert({
      where: { id },
      create: backpackMetadata,
      update: backpackMetadata,
    });
  }
  async getMissingMetadata() {
    // find all the tokens that don't have metadata
    // and add them to the queue
    const presentTokenIdsPromise = this.prismaService.backpackMetadata
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.id));
    // This is a superset of presentTokenIds as it is the source of truth of all tokens
    const allTokenIdsPromise = this.prismaService.knownTraits
      .findMany()
      .then((tokenIds) => tokenIds.map((token) => token.tokenId));
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
}
