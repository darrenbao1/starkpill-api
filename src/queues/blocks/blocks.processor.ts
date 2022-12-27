import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { BlocksService } from './blocks.service';
import { BLOCKS_QUEUE, INDEX_BLOCK } from '../constants';

@Injectable()
@Processor(BLOCKS_QUEUE)
export class BlocksProcessor {
  private readonly logger = new Logger(BlocksProcessor.name);

  constructor(private readonly blocksService: BlocksService) {}

  @Process(INDEX_BLOCK)
  async indexBlock() {}
}
