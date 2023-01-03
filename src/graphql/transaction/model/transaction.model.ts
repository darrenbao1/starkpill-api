import { Field, ObjectType, GraphQLTimestamp, Int } from '@nestjs/graphql';
import { Token } from 'src/graphql/token/model/token.model';
import { ChangeAttribute } from './changeAttribute.model';
import { Mint } from './mint.model';
import { Transfer } from './transfer.model';

@ObjectType()
export class Transaction {
  @Field(() => String)
  hash: string;

  @Field(() => Token)
  token: Token;

  @Field(() => Int)
  blockNumber: number;

  @Field(() => GraphQLTimestamp)
  timestamp: Date;

  // only 1 of the following 3 will be present
  @Field(() => Mint, { nullable: true })
  mint: Mint;

  @Field(() => Transfer, { nullable: true })
  transfer: Transfer;

  @Field(() => ChangeAttribute, { nullable: true })
  changeAttribute: ChangeAttribute;
}
