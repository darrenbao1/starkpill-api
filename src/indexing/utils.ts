import { hash } from 'starknet';

export enum EventName {
  Prescription_Updated = 'PrescriptionUpdated',
  Transfer = 'Transfer',
}

export const PRESCRIPTION_UPDATED_KEY =
  '0x' +
  hash.getSelectorFromName('PrescriptionUpdated').slice(2).padStart(64, '0');

export const TRANSFER_KEY =
  '0x' + hash.getSelectorFromName('Transfer').slice(2).padStart(64, '0');

export const CONTRACT_ADDRESS =
  '0x05ef092a31619faa63bf317bbb636bfbba86baf8e0e3e8d384ee764f2904e5dd';

export const NULL_FELT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const RESTART_STREAM_AFTER = 2 * 60 * 1000; // Restart the stream if no block has been received after 2min

export const uint8ToString = (uint8Arr: Uint8Array) => {
  let result = '0x';
  for (const letter of uint8Arr) {
    result = result.concat(letter.toString(16).padStart(2, '0'));
  }
  return result;
};

export const decodePrescriptionUpdated = (eventData: string[]) => {
  const data = eventData.map((d) => parseInt(d, 16));
  const owner = eventData[0];
  const [, tokenId, , mintPrice, , oldIng, , oldBG, , newIng, , newBG] = data;

  return { owner, tokenId, mintPrice, oldIng, oldBG, newIng, newBG };
};

export const decodeTransfer = (eventData: string[]) => {
  const [from, to, tokenId] = eventData;
  return {
    from,
    to,
    tokenId: parseInt(tokenId, 16),
  };
};

interface TrxnData {
  tokenId: number;
  timestamp: Date;
  blockNumber: number;
  trxnHash: string;
}

export interface PrescriptionUpdatedData extends TrxnData {
  owner: string;
  mintPrice: number;
  oldIng: number;
  oldBG: number;
  newIng: number;
  newBG: number;
}

export interface TransferData extends TrxnData {
  from: string;
  to: string;
}

export type IndexBlockData =
  | { data: PrescriptionUpdatedData; eventType: EventName.Prescription_Updated }
  | { data: TransferData; eventType: EventName.Transfer };
