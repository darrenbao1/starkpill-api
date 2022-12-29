import { EventType } from '@prisma/client';
import { hash } from 'starknet';

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

export const getEventType = (eventKey: string, eventData: string[]) => {
  const data = eventData.map((d) => parseInt(d, 16).toString());

  // mint or change attributes
  if (eventKey === PRESCRIPTION_UPDATED_KEY) {
    // for PrescriptionUpdated, index 2 and 4 are skipped because felt takes up 2 slots
    const [, , , , , oldIng, , oldBG, , , , , ,] = data;

    // if oldIng and oldBG are both 0, then it's a mint
    // !: This is problematic as the user may not have equipped either of the attributes, so both are '0' even though it's not a mint
    // TODO: Solution: In the mint handler in service, check if the tokenId alr exists, if so, take it as a change of attributes instead of mint
    if (oldIng === '0' && oldBG === '0') {
      return EventType.MINT;
    }

    return EventType.CHANGE_ATTRIBUTE;
  } else if (eventKey === TRANSFER_KEY) {
    return EventType.TRANSFER;
  }
  throw 'invalid event key';
};

export const decodeMint = (eventData: string[]) => {
  const data = eventData.map((d) => parseInt(d, 16));
  const owner = eventData[0];
  // for PrescriptionUpdated, index 2 and 4 are skipped because felt takes up 2 slots
  const [, tokenId, , mintPrice, , , , , , ing, , bg, ,] = data;

  return {
    owner,
    tokenId,
    mintPrice,
    ing,
    bg,
  };
};

export const decodeTransfer = (eventData: string[]) => {
  const [from, to, tokenId] = eventData;
  return {
    from,
    to,
    tokenId: parseInt(tokenId, 16),
  };
};

export const decodeChangeAttributes = (eventData: string[]) => {
  const data = eventData.map((d) => parseInt(d, 16));
  const owner = eventData[0];
  const [, tokenId, , , , oldIng, , oldBG, , newIng, , newBG, ,] = data;

  return { owner, tokenId, oldIng, oldBG, newIng, newBG };
};

interface TrxnData {
  tokenId: number;
  timestamp: Date;
  blockNumber: number;
  trxnHash: string;
}

export interface MintData extends TrxnData {
  owner: string;
  mintPrice: number;
  ing: number;
  bg: number;
}

export interface ChangeAttributeData extends TrxnData {
  owner: string;
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
  | { data: ChangeAttributeData; eventType: 'CHANGE_ATTRIBUTE' }
  | { data: MintData; eventType: 'MINT' }
  | { data: TransferData; eventType: 'TRANSFER' };
