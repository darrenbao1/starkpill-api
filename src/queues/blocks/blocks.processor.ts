import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BlocksService } from './blocks.service';
import {
  BLOCKS_QUEUE,
  INDEX_BLOCK,
  INVALIDATE_BLOCKS,
  MARK_BLOCK_AS_INDEXED,
} from '../constants';
import { EventName, IndexBlockData } from 'src/indexing/utils';

@Injectable()
@Processor(BLOCKS_QUEUE)
export class BlocksProcessor {
  private readonly logger = new Logger(BlocksProcessor.name);

  constructor(private readonly blocksService: BlocksService) {}

  @Process(INDEX_BLOCK)
  async indexBlock(job: Job<IndexBlockData>) {
    const { data, eventType } = job.data;
    if (eventType === EventName.Prescription_Updated) {
      await this.blocksService.handlePrescriptionUpdated(data);
    } else if (eventType === EventName.Transfer) {
      await this.blocksService.handleTransfer(data);
    } else if (eventType === EventName.SCALAR_TRANSFER) {
      await this.blocksService.handleScalarTransfer(data);
    } else if (eventType === EventName.SCALAR_REMOVE) {
      await this.blocksService.handleScalarRemove(data);
    } else if (eventType === EventName.PILL_FAME_UPDATED) {
      await this.blocksService.handleFameOrDefame(data);
    } else if (eventType === EventName.PILL_DEFAME_UPDATED) {
      await this.blocksService.handleFameOrDefame(data);
    } else if (eventType === EventName.PHARMACY_STOCK_UPDATED) {
      await this.blocksService.handlePharmacyStockUpdated(data);
    } else if (eventType === EventName.PILL_VOTE_TIMESTAMP) {
      await this.blocksService.handlePillVoteTimestamp(data);
    }
  }

  @Process(MARK_BLOCK_AS_INDEXED)
  async markBlockAsIndexed(job: Job<number>) {
    await this.blocksService.markBlockAsIndexed(job.data);
  }

  @Process(INVALIDATE_BLOCKS)
  async invalidateBlocks(job: Job<number>) {
    await this.blocksService.invalidateBlocks(job.data);
  }
}
