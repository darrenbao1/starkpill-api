import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';
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

  async indexBlockData(blockData: IndexBlockData) {
    await this.blocksQueue.add(INDEX_BLOCK, blockData, {
      attempts: 3,
      backoff: 1000,
    });
  }
}
