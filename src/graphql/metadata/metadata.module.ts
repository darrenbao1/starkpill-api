import { Module } from '@nestjs/common';
import { MetadataModule as MetadataQueueModule } from 'src/queues/metadata/metadata.module';
import { TokenModule } from '../token/token.module';
import { MetadataResolver } from './metadata.resolver';

@Module({
  imports: [MetadataQueueModule, TokenModule],
  providers: [MetadataResolver],
})
export class MetadataModule {}
