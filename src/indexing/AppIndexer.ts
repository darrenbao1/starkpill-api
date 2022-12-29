import { proto } from '@apibara/protocol';
import { Block } from '@apibara/starknet';
import { EventType } from '@prisma/client';
import {
  ChangeAttributeData,
  MintData,
  TransferData,
  CONTRACT_ADDRESS,
  decodeChangeAttributes,
  decodeMint,
  decodeTransfer,
  getEventType,
  NULL_FELT,
  PRESCRIPTION_UPDATED_KEY,
  TRANSFER_KEY,
  uint8ToString,
  IndexBlockData,
} from './utils';

/**
 * AppIndexer is used to keep track of the indexer's state between different
 * calls.
 */
export class AppIndexer {
  // protobuf encodes possibly-large numbers as strings
  private currentSequence?: string;

  handleData(data: proto.Data__Output): IndexBlockData {
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
        if (!event.keys[0] || !event.fromAddress || !event.data[0]) {
          continue;
        }
        const eventKey = uint8ToString(event.keys[0]);
        const eventSource = uint8ToString(event.fromAddress);
        const eventData = event.data.map((d) => uint8ToString(d));

        const wrongContract = eventSource !== CONTRACT_ADDRESS;
        const wrongEvent =
          eventKey !== PRESCRIPTION_UPDATED_KEY && eventKey !== TRANSFER_KEY;
        const irrelevantTransfer =
          eventKey === TRANSFER_KEY &&
          uint8ToString(event.data[0]) === NULL_FELT;

        if (wrongContract || wrongEvent || irrelevantTransfer) {
          continue;
        }

        const timestamp = block.timestamp;
        const blockNumber = block.blockNumber;
        const trxnHash = uint8ToString(trxn.transactionHash);

        // TODO: Add a new event type of change prescription when the old prescription is null
        const eventType = getEventType(eventKey, eventData);
        const commonData = { timestamp, blockNumber, trxnHash };

        if (eventType === EventType.MINT) {
          return {
            eventType,
            data: { ...decodeMint(eventData), ...commonData } as MintData,
          };
        } else if (eventType === EventType.CHANGE_ATTRIBUTE) {
          return {
            eventType,
            data: {
              ...decodeChangeAttributes(eventData),
              ...commonData,
            } as ChangeAttributeData,
          };
        } else if (eventType === EventType.TRANSFER) {
          return {
            eventType,
            data: {
              ...decodeTransfer(eventData),
              ...commonData,
            } as TransferData,
          };
        }

        return null;
      }
    }
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
