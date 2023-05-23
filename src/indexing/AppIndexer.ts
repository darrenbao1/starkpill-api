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
  SCALAR_TRANSFER_KEY,
  SCALAR_REMOVE_KEY,
  decodeScalarRemove,
  ScalarRemoveData,
  decodeScalarTransfer,
  ScalarTransferData,
  PILL_FAME_UPDATED_KEY,
  decodeFameOrDefameUpdated,
  PILL_DEFAME_UPDATED_KEY,
  PHARMARCY_STOCK_UPDATE,
  decodePharmacyStockUpdate,
  PILL_VOTE_TIMESTAMP,
  decodePillVoteTimeStamp,
  ATTRIBUTE_ADDED,
  decodeAttributeAdded,
  TRAIT_VOTE_TIME_STAMP,
  decodeTraitVoteTimeStamp,
  TRAIT_REDEMPTION_KEY,
  decodeTraitRedemption,
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
          lastPrescriptionUpdatedEvent = {
            eventType: EventName.Prescription_Updated,
            data: {
              ...decodePrescriptionUpdated(event.data),
              ...commonData,
            } as PrescriptionUpdatedData,
          } as IndexBlockData;
          continue;
        }
        //Scalar transfer event check
        else if (
          FieldElement.toHex(SCALAR_TRANSFER_KEY) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('scalar transfer event');
          eventsArr.push({
            eventType: EventName.SCALAR_TRANSFER,
            data: {
              ...decodeScalarTransfer(event.data),
              ...commonData,
            } as ScalarTransferData,
          });
          continue;
        }
        //Scalar remove event check
        else if (
          FieldElement.toHex(SCALAR_REMOVE_KEY) === FieldElement.toHex(eventKey)
        ) {
          console.log('scalar remove event');
          eventsArr.push({
            eventType: EventName.SCALAR_REMOVE,
            data: {
              ...decodeScalarRemove(event.data),
              ...commonData,
            } as ScalarRemoveData,
          });
          continue;
        }
        //Pill Fame Updated event check
        else if (
          FieldElement.toHex(PILL_FAME_UPDATED_KEY) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('pill fame updated event');
          eventsArr.push({
            eventType: EventName.PILL_FAME_UPDATED,
            data: {
              ...decodeFameOrDefameUpdated(event.data),
              ...commonData,
            },
          });
        }
        //Pill defame updated event check
        else if (
          FieldElement.toHex(PILL_DEFAME_UPDATED_KEY) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('pill defame updated event');
          eventsArr.push({
            eventType: EventName.PILL_DEFAME_UPDATED,
            data: {
              ...decodeFameOrDefameUpdated(event.data),
              ...commonData,
            },
          });
        }
        //Pharmacy updated event check
        else if (
          FieldElement.toHex(PHARMARCY_STOCK_UPDATE) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('Pharmacy stock updated event');
          eventsArr.push({
            eventType: EventName.PHARMACY_STOCK_UPDATED,
            data: {
              tokenId: 0, //does not have token id as it's the pharmacy stock.
              ...decodePharmacyStockUpdate(event.data),
              ...commonData,
            },
          });
        }
        //PillVoteTimeStamp event check
        else if (
          FieldElement.toHex(PILL_VOTE_TIMESTAMP) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('PillVoteTimeStamp event');
          console.log(decodePillVoteTimeStamp(event.data));
          eventsArr.push({
            eventType: EventName.PILL_VOTE_TIMESTAMP,
            data: {
              ...decodePillVoteTimeStamp(event.data),
              ...commonData,
            },
            //TODO
          });
        }
        //step 10 use the decoder here.
        //TraitRedemption event check
        else if (
          FieldElement.toHex(TRAIT_REDEMPTION_KEY) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('TraitRedemption event');
          eventsArr.push({
            eventType: EventName.TRAIT_REDEMPTION,
            data: {
              ...decodeTraitRedemption(event.data),
              ...commonData,
            },
          });
        } else if (
          FieldElement.toHex(ATTRIBUTE_ADDED) === FieldElement.toHex(eventKey)
        ) {
          console.log('Attribute added event');
          eventsArr.push({
            eventType: EventName.ATTRIBUTE_ADDED,
            data: {
              ...decodeAttributeAdded(event.data),
              ...commonData,
            },
          });
        } else if (
          FieldElement.toHex(TRAIT_VOTE_TIME_STAMP) ===
          FieldElement.toHex(eventKey)
        ) {
          console.log('TraittimeStamp event');
          console.log(decodeTraitVoteTimeStamp(event.data));
          eventsArr.push({
            eventType: EventName.TRAIT_VOTE_TIME_STAMP,
            data: {
              ...decodeTraitVoteTimeStamp(event.data),
              ...commonData,
            },
          });
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
