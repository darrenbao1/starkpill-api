import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MetadataService } from './metadata.service';
import { METADATA_QUEUE, INDEX_METADATA } from '../constants';

@Injectable()
@Processor(METADATA_QUEUE)
export class MetadataProcessor {
  private readonly logger = new Logger(MetadataProcessor.name);

  constructor(private readonly metadataService: MetadataService) {}

  @Process(INDEX_METADATA)
  async indexMetadata(job: Job<number>) {
    await this.metadataService.indexMetadata(job.data);
  }
}
