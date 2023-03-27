import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BLOCKS_QUEUE } from '../constants';
import { BlocksProcessor } from './blocks.processor';
import { BlocksService } from './blocks.service';
import {
  StreamClient,
  ChannelCredentials,
  v1alpha2,
  Cursor,
} from '@apibara/protocol';
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { AppIndexer } from 'src/indexing/AppIndexer';
import {
  CONTRACT_ADDRESS,
  INTERVAL_STREAM_CHECK,
  PRESCRIPTION_UPDATED_KEY,
  RESTART_STREAM_AFTER,
  TRANSFER_KEY,
} from 'src/indexing/utils';
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
  private filter: Uint8Array;
  private client: StreamClient;
  private interval: NodeJS.Timeout;
  private cursor: v1alpha2.ICursor;
  private takesTooLongTimeout: NodeJS.Timeout;

  private async createStream(initialBlock: number) {
    //create stream
    console.log('creating stream');
    this.indexer = new AppIndexer();
    this.cursor = Cursor.createWithOrderKey(initialBlock);
    this.client = new StreamClient({
      url: 'goerli.starknet.a5a.ch',
      credentials: ChannelCredentials.createSsl(),
      token: 'dna_T592xChWn3oqO0p9aBq2',
    });
    this.filter = Filter.create()
      .withHeader()
      //adding transfer event
      .addEvent((ev) =>
        ev.withFromAddress(CONTRACT_ADDRESS).withKeys([TRANSFER_KEY]),
      )
      //adding prescription updated event
      .addEvent((ev) =>
        ev
          .withFromAddress(CONTRACT_ADDRESS)
          .withKeys([PRESCRIPTION_UPDATED_KEY]),
      )
      .encode();
    this.client.configure({
      filter: this.filter,
      batchSize: 5,
      finality: v1alpha2.DataFinality.DATA_STATUS_ACCEPTED,
      cursor: this.cursor,
    });
    for await (const message of this.client) {
      if (message.data?.data) {
        for (let item of message.data.data) {
          const block = starknet.Block.decode(item);
          const indexedDataArr = this.indexer.handleData(block);
          const blockNumber = AppIndexer.getBlockNumber(
            block.header.blockNumber.toString(),
          );
          if (indexedDataArr.length > 0) {
            indexedDataArr.forEach((data) =>
              this.blocksService.queueIndexBlockData(data),
            );
          }
          this.blocksService.queueMarkBlockAsIndexed(blockNumber);
        }
      }
    }
  }

  async restartStream() {
    console.log('restarting stream');
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
