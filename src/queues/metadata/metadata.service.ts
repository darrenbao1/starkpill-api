import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { INDEX_METADATA, JOB_SETTINGS, METADATA_QUEUE } from '../constants';
import { TransferData, IndexBlockData } from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventType } from '@prisma/client';
import { TokenService } from 'src/graphql/token/token.service';

@Injectable()
export class MetadataService {
  queueGetMissingMetadata() {
    // find all the tokens that don't have metadata
    // and add them to the queue
  }

  async queueIndexMetadata(id?: number) {
    // add to queue for this id
    // if id is undefined, means index all, so add to queue for all ids
    // otherwise, add to queue for this id only
    if (id) {
      this.metadataQueue.add(INDEX_METADATA, id, JOB_SETTINGS);
    } else {
      // add to queue for all ids
      const tokenIds = (
        await this.tokenService.findAllTokens({
          first: Number.MAX_VALUE,
        })
      ).map((token) => token.id); // get all tokenIds

      tokenIds.forEach((id) =>
        this.metadataQueue.add(INDEX_METADATA, id, JOB_SETTINGS),
      );
    }
  }

  indexMetadata(id: number) {
    // call the contract for this id
    throw new Error('Method not implemented.');
  }

  constructor(
    @InjectQueue(METADATA_QUEUE) private readonly metadataQueue: Queue,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async handleTransfer({ from, ...eventData }: TransferData) {
    if (
      await this.prismaService.event.findFirst({
        where: { transactionHash: eventData.transactionHash },
      })
    ) {
      console.log('this transfer transaction has already been indexed');
      return;
    }

    const result = await this.prismaService.event.create({
      data: {
        ...eventData,
        Transfer: {
          create: { from },
        },
        eventType: EventType.TRANSFER,
      },
      include: {
        Transfer: true,
      },
    });

    console.log('transfer');
    console.log(result);
  }

  async queueIndexBlockData(blockData: IndexBlockData) {
    this.blocksQueue.add(INDEX_METADATA, blockData, {
      ...JOB_SETTINGS,
      priority: blockData.data.blockNumber, // higher than other blocks and lower than mark as indexed
    });
  }
}

/** Priority Queue
 * Jobs should run in order of priority
 * 1st: Invalidation of reorg data: If a reorg data, empty queue and create a job with MaxPriority = 1 to delete all data from the reorged block (Priority = 1)
 * 2nd: Indexing of normal events, priority is the block number, so that jobs are run in ascending block order(chronological order) (Priority = blockNumber)
 * 3rd: For marking of blocks as indexed, it should run after the events for this block but before the next block's events (Priority = blockNumber + 0.5)
 */
