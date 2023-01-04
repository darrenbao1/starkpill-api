import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Token } from '../../token/model/token.model';
import { Transaction } from '../../transaction/model/transaction.model';

@ObjectType()
export class User {
  @Field(() => String)
  address: string;

  @Field(() => [Token])
  tokens: Token[];

  @Field(() => Int)
  numberOfTokensOwned: number;

  @Field(() => [Transaction])
  transactions: Transaction[];
}
