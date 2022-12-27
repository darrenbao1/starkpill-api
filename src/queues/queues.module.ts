import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';
import { BLOCKS_QUEUE } from './constants';
import { BlocksModule } from './blocks/blocks.module';

@Module({
  imports: [BlocksModule],
  exports: [BlocksModule],
})
export class QueuesModule {
  constructor(
    @InjectQueue(BLOCKS_QUEUE) private readonly blocksQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const endpoint = '/queue-board';
    const username = this.configService.get('QUEUE_BOARD_USERNAME');
    const password = this.configService.get('QUEUE_BOARD_PASSWORD');

    const serverAdapter = new ExpressAdapter();

    createBullBoard({
      queues: [new BullAdapter(this.blocksQueue)],
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
