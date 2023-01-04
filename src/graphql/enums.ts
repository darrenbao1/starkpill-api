import { registerEnumType } from '@nestjs/graphql';
import { EventType } from '@prisma/client';

export { EventType as TransactionType };
registerEnumType(EventType, {
  name: 'TransactionType',
  description: 'Types of indexed transactions',
});
