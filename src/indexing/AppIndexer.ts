import { proto } from '@apibara/protocol';
import { Block } from '@apibara/starknet';
import { EventType } from '@prisma/client';
import {
  CONTRACT_ADDRESS,
  NULL_FELT,
  PRESCRIPTION_UPDATED_KEY,
  TRANSFER_KEY,
  uint8ToString,
} from './utils';

/**
 * AppIndexer is used to keep track of the indexer's state between different
 * calls.
 */
export class AppIndexer {
  // protobuf encodes possibly-large numbers as strings
  private currentSequence?: string;

  handleData(data: proto.Data__Output) {
    // track sequence number for reconnecting later
    this.currentSequence = data.sequence;
    if (!data.data?.value) {
      return;
    }
    const block = Block.decode(data.data.value);
    console.log('Block Number: ' + block.blockNumber);

    for (const trxn of block.transactionReceipts) {
      // console.log('Transaction Hash: ' + uint8ToString(trxn.transactionHash));

      for (const event of trxn.events) {
        const eventKey = uint8ToString(event.keys[0]);

        // Not emitted by our contract
        if (uint8ToString(event.fromAddress) !== CONTRACT_ADDRESS) continue;

        // Not a Transfer or PrescriptionUpdated event
        if (eventKey !== PRESCRIPTION_UPDATED_KEY && eventKey !== TRANSFER_KEY)
          continue;

        // Not a Transfer event with a null from field as this is a minting event
        if (
          eventKey === TRANSFER_KEY &&
          uint8ToString(event.data[0]) === NULL_FELT
        )
          continue;

        // TODO: Add a new event type of change prescription when the old prescription is null
        console.log({
          eventType:
            eventKey === PRESCRIPTION_UPDATED_KEY
              ? EventType.MINT
              : EventType.TRANSFER,
          fromAddress: uint8ToString(event.fromAddress),
          keys: event.keys.map((k) => uint8ToString(k)),
          data: event.data.map((d) => uint8ToString(d)),
        });
      }
    }
    // const blockHash = uint8ToString(block?.blockHash?.hash ?? new Uint8Array());
    // const parentBlockHash = uint8ToString(block?.parentBlockHash?.hash ?? new Uint8Array());
    // console.log(
    //   `[data] blockNumber=${block.blockNumber}, Hash: ${blockHash}, Parent Hash: ${parentBlockHash}`
    // );
  }

  handleInvalidate(invalidate: proto.Invalidate__Output) {
    console.log(`[invalidate] sequence=${invalidate.sequence}`);
    this.currentSequence = invalidate.sequence;
  }

  // Unused as we destroy the stream and create a new one
  // onRetry(retryCount: number) {
  //   // retry connecting up to 3 times, with a delay of 5 seconds in between
  //   // retries.
  //   // Start from the sequence number _following_ the last received message.
  //   const retry = retryCount < 3;
  //   const startingSequence = this.currentSequence
  //     ? +this.currentSequence + 1
  //     : undefined;

  //   console.log(
  //     `[retry] retry=${
  //       retry ? 'yes' : 'no'
  //     }, startingSequence=${startingSequence}`,
  //   );

  //   return { retry, delay: 0.1, startingSequence };
  // }
}
