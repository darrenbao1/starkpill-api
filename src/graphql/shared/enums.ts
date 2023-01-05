import { registerEnumType } from '@nestjs/graphql';
import { EventType } from '@prisma/client';

export { EventType as TransactionType };

export enum OrderBy {
  ASC = 'asc',
  DESC = 'desc',
}

registerEnumType(OrderBy, {
  name: 'OrderBy',
  description:
    'Ascending or descending block order. Ascending means the earliest block first, descending means the latest block first. Default is descending.',
});

registerEnumType(EventType, {
  name: 'TransactionType',
  description: 'Types of indexed transactions',
});
