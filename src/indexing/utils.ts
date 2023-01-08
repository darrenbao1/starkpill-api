import { Abi, Contract, hash, Provider, number, uint256 } from 'starknet';

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
  const contract = new Contract(testpillAbi as Abi, CONTRACT_ADDRESS, provider);

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
