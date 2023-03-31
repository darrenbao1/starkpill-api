import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BackpackMetadataService } from './backpackMetadata.service';
import { BACKPACK_QUEUE, INDEX_BACKPACK } from '../constants';

@Injectable()
@Processor(BACKPACK_QUEUE)
export class BackpackMetadataProcessor {
  private readonly logger = new Logger(BackpackMetadataProcessor.name);

  constructor(
    private readonly backpackMetadataService: BackpackMetadataService,
  ) {}

  @Process(INDEX_BACKPACK)
  async indexBackpack(job: Job<number>) {
    await this.backpackMetadataService.indexMetadata(job.data);
  }
}
