import { Module } from '@nestjs/common';
//import {TokenModule} from '../token/token.module';
import { BackpackMetadataModule as BackpackQueueModule } from 'src/queues/backpackMetadata/backpackMetadata.module';
import { BackpackMetadataResolver } from './backpackMetadata.resolver';

@Module({
  imports: [
    BackpackQueueModule,
    /*BackpackMetadataQueueModule, TokenModule*/
  ],
  providers: [BackpackMetadataResolver],
})
export class BackpackMetadataModule {}
