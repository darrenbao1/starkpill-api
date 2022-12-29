import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';
import {
  MintData,
  ChangeAttributeData,
  TransferData,
  IndexBlockData,
} from 'src/indexing/utils';

@Injectable()
export class BlocksService {
  async handleMint(data: MintData) {
    console.log('handling mint');
    console.log(data);
  }

  handleChangeAttribute(data: ChangeAttributeData) {
    console.log('handling changing attribute');
    console.log(data);
  }

  handleTransfer(data: TransferData) {
    console.log('handling transfer');
    console.log(data);
  }

  constructor(@InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue) {}

  async indexBlockData(blockData: IndexBlockData) {
    await this.blocksQueue.add(INDEX_BLOCK, blockData);
  }
}
