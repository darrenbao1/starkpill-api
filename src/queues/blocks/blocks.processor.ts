import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BlocksService } from './blocks.service';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';
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
    }
  }
}
