import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TokenModule } from 'src/graphql/token/token.module';
import { METADATA_QUEUE } from '../constants';
import { MetadataProcessor } from './metadata.processor';
import { MetadataService } from './metadata.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: METADATA_QUEUE,
    }),
    TokenModule,
  ],
  providers: [MetadataService, MetadataProcessor],
  exports: [MetadataService, BullModule],
})
export class MetadataModule {
  constructor(private readonly metadataService: MetadataService) {}

  async onModuleInit() {
    this.metadataService.queueGetMissingMetadata();
  }
}
