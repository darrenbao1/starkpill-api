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
import {
  INTERVAL_STREAM_CHECK,
  RESTART_STREAM_AFTER,
} from 'src/indexing/utils';
import { StreamMessagesResponse__Output } from '@apibara/protocol/dist/proto';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BLOCKS_QUEUE,
    }),
    MetadataModule,
  ],
  providers: [BlocksService, BlocksProcessor],
  exports: [BlocksService, BullModule],
})
export class BlocksModule {
  constructor(private readonly blocksService: BlocksService) {}

  private indexer: AppIndexer;
  private messages: StreamMessagesStream;
  private node: NodeClient;
  private interval: NodeJS.Timeout;

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

    this.messages.on('error', async (err: any) => {
      // recreate stream
      console.log('error occured in stream');
      console.log(err);
      this.restartStream();
    });

    this.messages.on('data', (msg: StreamMessagesResponse__Output) => {
      if (msg.data) {
        clearTimeout(this.takesTooLongTimeout);
        // ensure that the stream doesn't get stuck
        this.takesTooLongTimeout = setTimeout(async () => {
          console.log('restarting because it took too long');
          this.restartStream();
        }, RESTART_STREAM_AFTER);

        const indexedDataArr = this.indexer.handleData(msg.data);
        const blockNumber = AppIndexer.getBlockNumber(msg.data);

        if (indexedDataArr.length > 0) {
          indexedDataArr.forEach((data) =>
            this.blocksService.queueIndexBlockData(data),
          );
        }

        this.blocksService.queueMarkBlockAsIndexed(blockNumber);
      } else if (msg.invalidate) {
        this.blocksService.queueInvalidateBlocks(
          Number(msg.invalidate.sequence),
        );
        this.indexer.handleInvalidate(msg.invalidate);
      }
    });
  }

  async restartStream() {
    console.log('restarting stream');
    this.messages.destroy();
    this.messages.cleanupSource();

    const blockToRestartFrom =
      (await this.blocksService.getLastIndexedBlock()) + 1;
    this.createStream(blockToRestartFrom); // change to last indexed block + 1
  }

  async onModuleInit() {
    this.createStream((await this.blocksService.getLastIndexedBlock()) + 1);

    this.interval = setInterval(async () => {
      const lastIndexedTime =
        await this.blocksService.getLastIndexedBlockTime();

      if (!lastIndexedTime) {
        return;
      }

      const restart =
        new Date().getTime() - lastIndexedTime.getTime() >
        INTERVAL_STREAM_CHECK;

      if (restart) {
        this.restartStream();
      }
    }, INTERVAL_STREAM_CHECK);
  }
}
