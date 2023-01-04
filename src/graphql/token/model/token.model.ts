import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/graphql/user/models/user.model';
import { Transaction } from '../../transaction/model/transaction.model';

@ObjectType()
export class Token {
  @Field(() => Int)
  id: number;

  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field(() => User)
  owner: User;

  @Field(() => String)
  mintPrice: string;

  @Field(() => Int)
  background: number;

  @Field(() => Int)
  ingredient: number;
}
