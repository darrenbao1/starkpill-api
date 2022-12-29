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

export const uint8ToString = (uint8Arr: Uint8Array) => {
  let result = '0x';
  for (const letter of uint8Arr) {
    result = result.concat(letter.toString(16).padStart(2, '0'));
  }
  return result;
};
