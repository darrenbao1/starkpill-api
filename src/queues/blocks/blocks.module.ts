import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BLOCKS_QUEUE } from '../constants';
import { BlocksProcessor } from './blocks.processor';
import { BlocksService } from './blocks.service';
import {
  NodeClient,
  credentials,
  StreamMessagesStream,
} from '@apibara/protocol';
import { AppIndexer } from 'src/indexing/AppIndexer';
import { EventType } from '@prisma/client';
import { RESTART_STREAM_AFTER } from 'src/indexing/utils';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BLOCKS_QUEUE,
    }),
    PrismaModule,
  ],
  providers: [BlocksService, BlocksProcessor],
  exports: [BlocksService, BullModule],
})
export class BlocksModule {
  constructor(private readonly blocksService: BlocksService) {}

  private indexer: AppIndexer;
  private messages: StreamMessagesStream;
  private node: NodeClient;

  private takesTooLongTimeout: NodeJS.Timeout;

  private createStream(initialBlock: number) {
    this.indexer = new AppIndexer();

    this.node = new NodeClient(
      'goerli.starknet.stream.apibara.com:443',
      credentials.createSsl(),
    );

    this.messages = this.node.streamMessages(
      { startingSequence: initialBlock },
      { onRetry: this.indexer.onRetry, reconnect: true },
    );

    this.messages.on('end', (msg: any) => {
      console.log(msg);
      console.log('stopping stream');
    });

    this.messages.on('error', (err: any) => {
      // recreate stream
      console.log('error occured in stream');
      console.log(err);
      this.messages.destroy();
      this.createStream(initialBlock); // change to last indexed block + 1
    });

    this.messages.on('data', (msg) => {
      if (msg.data) {
        clearTimeout(this.takesTooLongTimeout);
        // ensure that the stream doesn't get stuck
        this.takesTooLongTimeout = setTimeout(() => {
          console.log('restarting because it took too long');
          this.messages.destroy();
          this.messages.cleanupSource();
          this.createStream(initialBlock); // change to last indexed block + 1
        }, RESTART_STREAM_AFTER);

        const indexedDataArr = this.indexer.handleData(msg.data);
        if (!indexedDataArr || indexedDataArr.length === 0) return;

        indexedDataArr.forEach((data) =>
          this.blocksService.indexBlockData(data),
        );
      } else if (msg.invalidate) {
        this.indexer.handleInvalidate(msg.invalidate);
      }
    });
  }

  onModuleInit() {
    this.createStream(565020);
  }
}
