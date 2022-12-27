import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';

@Injectable()
export class BlocksService {
  constructor(@InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue) {}

  async indexBlockData() {
    await this.blocksQueue.add(INDEX_BLOCK, {});
  }
}
