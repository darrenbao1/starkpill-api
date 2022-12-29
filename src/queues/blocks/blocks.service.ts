import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';

interface TrxnData {
  tokenId: number;
  timestamp: Date;
  blockNumber: number;
  trxnHash: string;
}

interface MintData extends TrxnData {
  owner: string;
  mintPrice: number;
  ing: number;
  bg: number;
}

interface ChangeAttributeData extends TrxnData {
  owner: string;
  oldIng: number;
  oldBG: number;
  newIng: number;
  newBG: number;
}

interface TransferData extends TrxnData {
  from: string;
  to: string;
}

@Injectable()
export class BlocksService {
  handleMint(data: MintData) {
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

  async indexBlockData() {
    await this.blocksQueue.add(INDEX_BLOCK, {});
  }
}
