import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  BLOCKS_QUEUE,
  INDEX_BLOCK,
  INVALIDATE_BLOCKS,
  JOB_SETTINGS,
  MARK_BLOCK_AS_INDEXED,
} from '../constants';
import {
  TransferData,
  IndexBlockData,
  PrescriptionUpdatedData,
} from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventType } from '@prisma/client';

@Injectable()
export class BlocksService {
  constructor(
    @InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue,
    private readonly prismaService: PrismaService,
  ) {}

  async handlePrescriptionUpdated({
    tokenId,
    transactionHash,
    blockNumber,
    timestamp,
    owner: to,
    mintPrice,
    oldIng,
    oldBG,
    newIng,
    newBG,
  }: PrescriptionUpdatedData) {
    // handle mints and changing of attributes
    // if this tokenId has been minted, then it's a change of attributes, otherwise it's a mint
    if (
      await this.prismaService.event.findFirst({
        where: { transactionHash },
      })
    ) {
      console.log('this transaction has already been indexed');
      return;
    }

    // if an instance of a tokenId is already in the database, then it has alr been minted
    // so we can assume that this is a change of attributes
    const alreadyMinted = await this.prismaService.event.findFirst({
      where: { tokenId },
    });

    if (alreadyMinted) {
      // change of attributes
      const result = await this.prismaService.event.create({
        data: {
          to,
          transactionHash,
          blockNumber,
          timestamp,
          tokenId,
          eventType: EventType.CHANGE_ATTRIBUTE,
          ChangeAttribute: {
            create: {
              oldBackground: oldBG,
              oldIngredient: oldIng,
              newBackground: newBG,
              newIngredient: newIng,
            },
          },
        },
        include: {
          ChangeAttribute: true,
        },
      });

      console.log('Changing attributes');
      console.log(result);
    } else {
      // mint
      const result = await this.prismaService.event.create({
        data: {
          to,
          transactionHash,
          blockNumber,
          timestamp,
          tokenId,
          eventType: EventType.MINT,
          Mint: {
            create: {
              mintPrice,
              background: newBG,
              ingredient: newIng,
            },
          },
        },
        include: {
          Mint: true,
        },
      });

      console.log('minting price');
      console.log(result.Mint.mintPrice.toString());

      console.log('Minting');
      console.log(result);
    }
  }

  async handleTransfer({ from, ...eventData }: TransferData) {
    if (
      await this.prismaService.event.findFirst({
        where: { transactionHash: eventData.transactionHash },
      })
    ) {
      console.log('this transaction has already been indexed');
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
    await this.blocksQueue.add(INDEX_BLOCK, blockData, {
      ...JOB_SETTINGS,
      priority: blockData.data.blockNumber, // higher than other blocks and lower than mark as indexed
    });
  }

  async queueMarkBlockAsIndexed(blockNumber: number) {
    await this.blocksQueue.add(MARK_BLOCK_AS_INDEXED, blockNumber, {
      ...JOB_SETTINGS,
      priority: blockNumber + 0.5, // lower than index block data but higher than other blocks
    });
  }

  async queueInvalidateBlocks(blockNumber: number) {
    await this.blocksQueue.empty();
    await this.blocksQueue.add(INVALIDATE_BLOCKS, blockNumber, {
      ...JOB_SETTINGS,
      priority: 1, //  Max priority
    });
  }

  async markBlockAsIndexed(lastIndexedBlock: number) {
    await this.prismaService.metadata.upsert({
      where: { id: 1 },
      update: { lastIndexedBlock },
      create: { lastIndexedBlock },
    });
  }

  async invalidateBlocks(blockNumber: number) {
    await this.prismaService.event.deleteMany({
      where: { blockNumber: { gte: blockNumber } },
    });
  }

  async getLastIndexedBlock() {
    return (
      (await this.prismaService.metadata.findFirst({ where: { id: 1 } }))
        ?.lastIndexedBlock ?? 500000 // replace with seeded value
    );
  }
}

/** Priority Queue
 * Jobs should run in order of priority
 * 1st: Invalidation of reorg data: If a reorg data, empty queue and create a job with MaxPriority = 1 to delete all data from the reorged block (Priority = 1)
 * 2nd: Indexing of normal events, priority is the block number, so that jobs are run in ascending block order(chronological order) (Priority = blockNumber)
 * 3rd: For marking of blocks as indexed, it should run after the events for this block but before the next block's events (Priority = blockNumber + 0.5)
 */
