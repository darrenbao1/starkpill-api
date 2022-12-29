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

@Module({
  imports: [
    BullModule.registerQueue({
      name: BLOCKS_QUEUE,
    }),
  ],
  providers: [BlocksService, BlocksProcessor],
  exports: [BlocksService, BullModule],
})
export class BlocksModule {
  constructor(private readonly blocksService: BlocksService) {}

  private indexer: AppIndexer;
  private messages: StreamMessagesStream;
  private node: NodeClient;

  private createStream(initialBlock: number) {
    this.indexer = new AppIndexer();

    this.node = new NodeClient(
      'goerli.starknet.stream.apibara.com:443',
      credentials.createSsl(),
    );

    this.messages = this.node.streamMessages({
      startingSequence: initialBlock,
    });

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
        const indexedData = this.indexer.handleData(msg.data);
        if (!indexedData) return;

        const { eventType, data } = indexedData;
        if (eventType === EventType.MINT) {
          this.blocksService.handleMint(data);
        } else if (eventType === EventType.TRANSFER) {
          this.blocksService.handleTransfer(data);
        } else if (eventType === EventType.CHANGE_ATTRIBUTE) {
          this.blocksService.handleChangeAttribute(data);
        }
      } else if (msg.invalidate) {
        this.indexer.handleInvalidate(msg.invalidate);
      }
    });
  }

  onModuleInit() {
    this.createStream(563710);
  }
}
