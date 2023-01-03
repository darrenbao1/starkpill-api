import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Transaction } from '../../transaction/model/transaction.model';

@ObjectType()
export class Token {
  @Field(() => Int)
  id: number;

  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field(() => String)
  owner: string;

  @Field(() => String)
  mintPrice: string;
}
