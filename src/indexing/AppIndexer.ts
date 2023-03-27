import {
  StreamClient,
  ChannelCredentials,
  v1alpha2,
  ConfigureArgs,
} from '@apibara/protocol';
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
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
  static getBlockNumber(data: string): number {
    return Number(data);
  }
  handleData(block: starknet.Block): IndexBlockData[] {
    const blockNumber = block.header.blockNumber.toString();
    console.log('Block Number: ' + blockNumber);
    const eventsArr: IndexBlockData[] = [];
    let lastPrescriptionUpdatedEvent;
    for (let { transaction, event } of block.events) {
      const hash = transaction?.meta?.hash;
      if (!event || !event.data || !hash) {
        continue;
      }
      for (let eventKey of event.keys) {
        const blockNumber = Number(block.header.blockNumber.toString());
        const transactionHash = FieldElement.toHex(transaction.meta.hash);
        const timestamp = new Date(
          Number(block.header.timestamp.seconds.toString()) * 1000,
        );
        const commonData = { timestamp, blockNumber, transactionHash };
        //Transfer event check
        if (FieldElement.toHex(TRANSFER_KEY) === FieldElement.toHex(eventKey)) {
          // ignore if transferred from or to NFT contract or a null address
          //  null address and contract addresses
          const irrevelantAddresses = [
            FieldElement.toHex(CONTRACT_ADDRESS),
            '0x0',
          ];
          const irrevelantTransfer =
            irrevelantAddresses.includes(FieldElement.toHex(event.data[0])) ||
            irrevelantAddresses.includes(FieldElement.toHex(event.data[1]));
          if (irrevelantTransfer) {
            continue;
          }
          console.log('transfer event');
          eventsArr.push({
            eventType: EventName.Transfer,
            data: {
              ...decodeTransfer(event.data),
              ...commonData,
            } as TransferData,
          });
          continue;
        }
        //Prescription updated event check
        else if (
          FieldElement.toHex(PRESCRIPTION_UPDATED_KEY) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('prescription updated event');
          eventsArr.push({
            eventType: EventName.Prescription_Updated,
            data: {
              ...decodePrescriptionUpdated(event.data),
              ...commonData,
            } as PrescriptionUpdatedData,
          } as IndexBlockData);
          continue;
        }

        //Unknown event
        else {
          console.log('unknown event');
        }
      }
    }
    if (lastPrescriptionUpdatedEvent) {
      eventsArr.push(lastPrescriptionUpdatedEvent);
    }
    return eventsArr;
  }
}
