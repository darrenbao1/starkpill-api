import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';
import {
  TransferData,
  IndexBlockData,
  PrescriptionUpdatedData,
} from 'src/indexing/utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class BlocksService {
  async handlePrescriptionUpdated(data: PrescriptionUpdatedData) {
    // handle mints and changing of attributes
    // if this tokenId has been minted, then it's a change of attributes, otherwise it's a mint
    console.log('mint or attributes changed');
    await sleep(5000);
    throw 'mint or attributes change failed';
    console.log(data);
  }

  async handleTransfer(data: TransferData) {
    // handle transfers only
    await sleep(10000);
    console.log('handling transfer');
    console.log(data);
    // console.log(data);
  }

  constructor(@InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue) {}

  async indexBlockData(blockData: IndexBlockData) {
    await this.blocksQueue.add(INDEX_BLOCK, blockData, {
      attempts: 3,
      backoff: 1000,
    });
  }
}
