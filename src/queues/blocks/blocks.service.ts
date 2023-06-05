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
  ScalarRemoveData,
  ScalarTransferData,
  PillFameData,
  PharmacyStockData,
  PillVoteTimeStampData,
  AttributedAddedData,
  checkIfIsTraitOrPill,
  TraitRedemptionData,
} from 'src/indexing/utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventType } from '@prisma/client';
import { MetadataService } from '../metadata/metadata.service';
import { BackpackMetadataService } from '../backpackMetadata/backpackMetadata.service';
@Injectable()
export class BlocksService {
  constructor(
    @InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue,
    private readonly metadataService: MetadataService,
    private readonly prismaService: PrismaService,
    private readonly backpackMetadataService: BackpackMetadataService,
  ) {}

  async handlePrescriptionUpdated({
    eventIndex,
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
        where: { transactionHash, eventIndex },
      })
    ) {
      console.log(
        'this mint/change attributes transaction has already been indexed',
      );
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
          eventIndex,
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
    } else {
      // mint
      const result = await this.prismaService.event.create({
        data: {
          eventIndex,
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
      //add this to backpack meta data queue. It might fail.
      //therefore I created another table called KnownTraits where it will contain all the ids of every trait ever created.
      if (newBG != 0) {
        await this.prismaService.knownTraits.create({
          data: { tokenId: newBG },
        });
        this.backpackMetadataService.queueIndexMetadata(newBG);
      }
      if (newIng != 0) {
        await this.prismaService.knownTraits.create({
          data: { tokenId: newIng },
        });
        this.backpackMetadataService.queueIndexMetadata(newIng);
      }
      console.log('Minting');
    }

    // Update the token metadata table, don't need to await as it's a side effect
    this.metadataService.queueIndexMetadata(tokenId);
  }
  async handleFameOrDefame({ tokenId, ...eventData }: PillFameData) {
    console.log("Fame or defame event detected, updating token's metadata");
    this.metadataService.queueIndexMetadata(tokenId);
  }

  async handlePharmacyStockUpdated({
    typeIndex,
    index,
    startAmount,
    ammount_left,
    ...eventData
  }: PharmacyStockData) {
    console.log('Pharmacy stock updated');

    // Check if the stock already exists
    const existingStock = await this.prismaService.pharmacyData.findFirst({
      where: { typeIndex, index },
    });

    if (existingStock) {
      // If the stock exists, update the `amount_left` field
      const updatedStock = await this.prismaService.pharmacyData.update({
        where: { typeIndex_index: { typeIndex, index } },
        data: { startAmount, amount_left: ammount_left },
      });

      console.log('Stock updated:', updatedStock);
    } else {
      // If the stock does not exist, create a new record
      const newStock = await this.prismaService.pharmacyData.create({
        data: {
          typeIndex,
          index,
          startAmount,
          amount_left: ammount_left,
        },
      });

      console.log('New stock created:', newStock);
    }
  }

  async handleTransfer({ from, ...eventData }: TransferData) {
    if (
      await this.prismaService.event.findFirst({
        where: {
          transactionHash: eventData.transactionHash,
          eventIndex: eventData.eventIndex,
        },
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

    const isPill = await this.checkIfIsPill(eventData.tokenId);

    if (!isPill) {
      await this.handleTransferIfIsTraitOrPill({ from, ...eventData });
    }
  }
  async checkIfIsPill(tokenId: number) {
    //Get all events from prisma that has the tokenId
    const result = await this.prismaService.event.findMany({
      where: { tokenId },
    });
    // Check if there is a mint event for the token ID if no, means it is not a pill.
    const hasMintEvent = result.some((event) => event.eventType === 'MINT');
    return hasMintEvent;
  }
  async handleTransferIfIsTraitOrPill({ from, ...eventData }: TransferData) {
    //Check if the eventData.tokenId exist in the backpack, if exist, then edit the owner address to eventData.to
    if (
      await this.prismaService.backpack.findFirst({
        where: { id: eventData.tokenId },
      })
    ) {
      console.log('this is a transfer from backpack to backpack');
      const result = await this.prismaService.backpack.update({
        where: { id: eventData.tokenId },
        data: { ownerAddress: eventData.to },
      });

      //else create a new record for the new trait
    } else {
      console.log('This is receiving a trait from contract.');
      const result = await this.prismaService.backpack.create({
        data: {
          id: eventData.tokenId,
          ownerAddress: eventData.to,
        },
      });
    }
  }

  async handleScalarRemove({ tokenId, to, ...eventData }: ScalarRemoveData) {
    if (
      await this.prismaService.backpack.findFirst({ where: { id: tokenId } })
    ) {
      console.log('this Scalar Remove transaction has already been indexed');
      return;
    }
    const result = await this.prismaService.backpack.create({
      data: {
        id: tokenId,
        ownerAddress: to,
      },
    });
    console.log('Scalar Remove');

    //No longer need this because when user mint a pill, pill will be added to backpack and metadata will be generated already.
    //Since trait can never change their metadata, no need to queue metadata generation.
    // this.backpackMetadataService.queueIndexMetadata(tokenId);
  }
  async handleScalarTransfer({ tokenId, ...eventData }: ScalarTransferData) {
    if (
      await this.prismaService.backpack.findFirst({ where: { id: tokenId } })
    ) {
      console.log('deleting this item from db as it has been transferred');
      const result = await this.prismaService.backpack.delete({
        where: { id: tokenId },
      });

      return;
    } else {
      console.log('irrelevant ScalarTransfer');
    }
  }

  async handlePillVoteTimestamp({
    tokenId,
    time_stamp,
  }: PillVoteTimeStampData) {
    console.log('Pill vote event detected, updating token metadata');
    //TODO
    //Convert time_stamp from unix time to date
    const time_stampInDate = new Date(time_stamp * 1000);

    //check if tokenId exists in VotingBooth
    //if it does, update the time_stamp
    //if it doesn't, create a new record
    const existingVote = await this.prismaService.votingBooth.findFirst({
      where: { tokenId },
    });

    if (existingVote) {
      // If the vote exists, update the `time_stamp` field
      const updatedVote = await this.prismaService.votingBooth.update({
        where: { tokenId },
        data: { time_Stamp: time_stampInDate },
      });

      console.log('Vote updated:', updatedVote);
    } else {
      const newVote = await this.prismaService.votingBooth.create({
        data: {
          tokenId,
          time_Stamp: time_stampInDate,
        },
      });

      console.log('New vote created:', newVote);
    }
  }
  //step 9
  async handleTraitRedemption({ tokenId, ...eventData }: TraitRedemptionData) {
    console.log('Trait redemption event detected, updating token metadata');
    //Check if Primary key which is L1_Address and L1_TokenId exists in TraitRedemption
    const existingRedemption =
      await this.prismaService.traitRedemption.findFirst({
        where: {
          l1_address: eventData.l1_address,
          l1_tokenId: eventData.l1_tokenId,
          tokenId: tokenId,
        },
      });
    if (existingRedemption) {
      console.log('Trait redemption already exists');
      return;
    } else {
      //If it doesn't exist, create a new record
      const newRedemption = await this.prismaService.traitRedemption.create({
        data: {
          l1_address: eventData.l1_address,
          l1_tokenId: eventData.l1_tokenId,
          tokenId: tokenId,
          to: eventData.to,
        },
      });
      console.log('New trait redemption created:', newRedemption);
      //Create a new recored in BackPack. with tokenId and to
      //Should do a check if tokenId already exists in BackPack
      if (
        await this.prismaService.knownTraits.findFirst({
          where: { tokenId: tokenId },
        })
      ) {
        console.log('this trait has already been claimed!');
        return;
      }
      const result2 = await this.prismaService.knownTraits.create({
        data: {
          tokenId: tokenId,
        },
      });
      const result = await this.prismaService.backpack.create({
        data: {
          id: tokenId,
          ownerAddress: eventData.to,
        },
      });
      console.log('Trait Claimed!');

      this.backpackMetadataService.queueIndexMetadata(tokenId);
    }
  }
  async handleAttributeAdded({
    tokenId,
    attrId,
    ...eventData
  }: AttributedAddedData) {
    if (attrId != 1) {
      //irrevelant attribute added event
      return;
    } else {
      //check if tokenId exists in VotingPowerIds
      const existingVote = await this.prismaService.votingPowerIds.findFirst({
        where: { tokenId },
      });
      if (existingVote) {
        // If tokenId exists, ignore the event
        return;
      } else {
        //create a new record
        const newVote = await this.prismaService.votingPowerIds.create({
          data: {
            tokenId,
          },
        });
      }
    }
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
      update: { lastIndexedBlock, lastIndexedTime: new Date() },
      create: { lastIndexedBlock, lastIndexedTime: new Date() },
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
        ?.lastIndexedBlock ?? 503000 // replace with seeded value
    );
  }

  async getLastIndexedBlockTime() {
    return (await this.prismaService.metadata.findFirst({ where: { id: 1 } }))
      ?.lastIndexedTime;
  }
}

/** Priority Queue
 * Jobs should run in order of priority
 * 1st: Invalidation of reorg data: If a reorg data, empty queue and create a job with MaxPriority = 1 to delete all data from the reorged block (Priority = 1)
 * 2nd: Indexing of normal events, priority is the block number, so that jobs are run in ascending block order(chronological order) (Priority = blockNumber)
 * 3rd: For marking of blocks as indexed, it should run after the events for this block but before the next block's events (Priority = blockNumber + 0.5)
 */
