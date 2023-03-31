import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
//import { TokenModule } from 'src/graphql/token/token.module';
import { BACKPACK_QUEUE } from '../constants';
import { BackpackMetadataProcessor } from './backpackMetadata.processor';
import { BackpackMetadataService } from './backpackMetadata.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BACKPACK_QUEUE,
    }),
    //TokenModule,
  ],
  providers: [BackpackMetadataService, BackpackMetadataProcessor],
  exports: [BackpackMetadataService, BullModule],
})
export class BackpackMetadataModule {
  constructor(
    private readonly backpackMetadataService: BackpackMetadataService,
  ) {}

  async onModuleInit() {
    this.backpackMetadataService.queueGetMissingMetadata();
  }
}
