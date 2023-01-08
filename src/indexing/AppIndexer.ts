import { proto } from '@apibara/protocol';
import { Block } from '@apibara/starknet';

import {
  TransferData,
  CONTRACT_ADDRESS,
  decodeTransfer,
  NULL_FELT,
  PRESCRIPTION_UPDATED_KEY,
  TRANSFER_KEY,
  uint8ToString,
  IndexBlockData,
  decodePrescriptionUpdated,
  PrescriptionUpdatedData,
  EventName,
} from './utils';

/**
 * AppIndexer is used to keep track of the indexer's state between different
 * calls.
 */
export class AppIndexer {
  // protobuf encodes possibly-large numbers as strings
  private currentSequence?: string;

  static getBlockNumber(data: proto.Data__Output): number {
    const block = Block.decode(data.data.value);
    return block.blockNumber;
  }

  handleData(data: proto.Data__Output): IndexBlockData[] {
    // track sequence number for reconnecting later
    this.currentSequence = data.sequence;
    if (!data.data?.value) {
      return [];
    }
    const block = Block.decode(data.data.value);
    console.log('Block Number: ' + block.blockNumber);
    const eventsArr: IndexBlockData[] = [];

    for (const trxn of block.transactionReceipts) {
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

        // ignore if transferred from or to NFT contract or a null address
        const irrelevantTransfer =
          eventKey === TRANSFER_KEY &&
          ([NULL_FELT, CONTRACT_ADDRESS].includes(
            uint8ToString(event.data[0]),
          ) ||
            [NULL_FELT, CONTRACT_ADDRESS].includes(
              uint8ToString(event.data[1]),
            ));

        if (wrongContract || wrongEvent || irrelevantTransfer) {
          continue;
        }

        const timestamp = block.timestamp;
        const blockNumber = block.blockNumber;
        const transactionHash = uint8ToString(trxn.transactionHash);

        // TODO: Add a new event type of change prescription when the old prescription is null
        const eventType =
          eventKey === PRESCRIPTION_UPDATED_KEY
            ? EventName.Prescription_Updated
            : EventName.Transfer;
        const commonData = { timestamp, blockNumber, transactionHash };

        // once an event is found, add it to the array and continue to the next trxn as each trxn only has one indexed event
        // e.g. a mint event also has transfer events, but will be ignored
        if (eventType === EventName.Prescription_Updated) {
          eventsArr.push({
            eventType,
            data: {
              ...decodePrescriptionUpdated(eventData),
              ...commonData,
            } as PrescriptionUpdatedData,
          });

          continue;
        } else if (eventType === EventName.Transfer) {
          eventsArr.push({
            eventType,
            data: {
              ...decodeTransfer(eventData),
              ...commonData,
            } as TransferData,
          });

          continue;
        }
      }
    }

    return eventsArr;
  }

  handleInvalidate(invalidate: proto.Invalidate__Output) {
    console.log(`[invalidate] sequence=${invalidate.sequence}`);
    this.currentSequence = invalidate.sequence;
  }

  // Unused as we destroy the stream and create a new one
  onRetry(retryCount: number) {
    // retry connecting up to 3 times, with a delay of 1 seconds in between
    // retries.
    // Start from the sequence number _following_ the last received message.
    const retry = retryCount < 3;
    const startingSequence = this.currentSequence
      ? +this.currentSequence + 1
      : undefined;

    console.log(
      `[retry] retry=${
        retry ? 'yes' : 'no'
      }, startingSequence=${startingSequence}`,
    );

    return { retry, delay: 1, startingSequence };
  }
}
