import { Abi, Contract, hash, Provider, number, uint256 } from 'starknet';
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
export enum EventName {
  Prescription_Updated = 'PrescriptionUpdated',
  Transfer = 'Transfer',
}

export const TRANSFER_KEY = FieldElement.fromBigInt(
  hash.getSelectorFromName('Transfer'),
);
export const PRESCRIPTION_UPDATED_KEY = FieldElement.fromBigInt(
  hash.getSelectorFromName('PrescriptionUpdated'),
);

export const CONTRACT_ADDRESS = FieldElement.fromBigInt(
  '0x05ef092a31619faa63bf317bbb636bfbba86baf8e0e3e8d384ee764f2904e5dd',
);

export const NULL_FELT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const RESTART_STREAM_AFTER = 2 * 60 * 1000; // Restart the stream if no block has been received after 2min
export const INTERVAL_STREAM_CHECK = 10 * 60 * 1000; // Use an interval to check if the stream is still alive every 10 min

export const uint8ToString = (uint8Arr: Uint8Array) => {
  let result = '0x';
  for (const letter of uint8Arr) {
    result = result.concat(letter.toString(16).padStart(2, '0'));
  }
  return result;
};

export const decodePrescriptionUpdated = (
  eventData: starknet.IFieldElement[],
) => {
  const dataArray = eventData.map((d) => FieldElement.toHex(d));
  const [owner, tokenId, , mintPrice, , oldIng, , oldBG, , newIng, , newBG] =
    dataArray;
  return {
    owner: convertToStandardWalletAddress(owner),
    tokenId: parseInt(tokenId, 16),
    mintPrice: parseInt(mintPrice, 16),
    oldIng: parseInt(oldIng, 16),
    oldBG: parseInt(oldBG, 16),
    newIng: parseInt(newIng, 16),
    newBG: parseInt(newBG, 16),
  };
};

export const decodeTransfer = (eventData: starknet.IFieldElement[]) => {
  const dataArray = eventData.map((d) => FieldElement.toHex(d));
  const [from, to, tokenId] = dataArray;
  return {
    from: convertToStandardWalletAddress(from),
    to: convertToStandardWalletAddress(to),
    tokenId: parseInt(tokenId, 16),
  };
};

export const hex2a = (hexx: string) => {
  const hex = hexx.toString(); //force conversion
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    // TODO: Fix deprecation
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)).replace(
      '\x00',
      '',
    );
  }
  str = str.replace('data:application/json,', '');
  return str;
};

import testpillAbi from 'src/abi/testpill.json';

interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: [
    { trait_type: 'Medical Bill'; value: number },
    { trait_type: 'Ingredient'; value: string },
    { trait_type: 'Background'; value: string },
  ];
}

export const getMetadataFromContract = async (id: number) => {
  const provider = new Provider({ sequencer: { network: 'goerli-alpha' } });
  const contract = new Contract(
    testpillAbi as Abi,
    FieldElement.toHex(CONTRACT_ADDRESS),
    provider,
  );

  const contractUriRaw = await contract.call('tokenURI', [
    uint256.bnToUint256(number.toBN(id)),
  ]);

  const resultArray = contractUriRaw.map((data) =>
    number.bigNumberishArrayToHexadecimalStringArray(data),
  );

  const jsonMetadata: TokenMetadata = JSON.parse(
    resultArray[0].map((json) => hex2a(json)).join(''),
  );

  const description = jsonMetadata.description;
  const imageUrl = jsonMetadata.image;
  const atributes = jsonMetadata.attributes;
  // !: If '' is returned for ingredient or background, it means there's no value
  const mintPrice = atributes[0]?.value ?? 0;
  const ingredient = atributes[1]?.value ?? '';
  const background = atributes[2]?.value ?? '';

  return { id, description, imageUrl, mintPrice, ingredient, background };
};

interface TrxnData {
  tokenId: number;
  timestamp: Date;
  blockNumber: number;
  transactionHash: string;
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

export function convertToStandardWalletAddress(walletAddress: string) {
  return '0x' + walletAddress.substring(2).padStart(64, '0');
}
