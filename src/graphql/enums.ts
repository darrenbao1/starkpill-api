import { registerEnumType } from '@nestjs/graphql';

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  MINT = 'MINT',
  CHANGE_ATTRIBUTE = 'CHANGE_ATTRIBUTE',
}

registerEnumType(TransactionType, { name: 'TransactionType' });
