import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import { BACKPACK_QUEUE, BLOCKS_QUEUE, METADATA_QUEUE } from './constants';
import { BlocksModule } from './blocks/blocks.module';
import { MetadataModule } from './metadata/metadata.module';
import { BackpackMetadataModule } from './backpackMetadata/backpackMetadata.module';

@Module({
  imports: [BlocksModule, MetadataModule, BackpackMetadataModule],
  exports: [BlocksModule, MetadataModule, BackpackMetadataModule], // TODO: remove this export
})
export class QueuesModule {
  constructor(
    @InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue,
    @InjectQueue(METADATA_QUEUE) private readonly metadataQueue: Queue,
    @InjectQueue(BACKPACK_QUEUE) private readonly backpackQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const endpoint = '/queue-board';
    const username = this.configService.get('QUEUE_BOARD_USERNAME');
    const password = this.configService.get('QUEUE_BOARD_PASSWORD');

    const serverAdapter = new ExpressAdapter();

    createBullBoard({
      queues: [
        new BullAdapter(this.blocksQueue),
        new BullAdapter(this.metadataQueue),
        new BullAdapter(this.backpackQueue),
      ],
      serverAdapter,
    });

    consumer
      .apply(
        expressBasicAuth({
          // authentication for the queue board
          users: username && password ? { [username]: password } : {},
          challenge: true,
        }),
        serverAdapter.setBasePath(endpoint).getRouter(),
      )
      .forRoutes(endpoint);
  }
}
