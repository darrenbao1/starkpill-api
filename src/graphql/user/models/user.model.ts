import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Token } from '../../token/model/token.model';
import { Transaction } from '../../transaction/model/transaction.model';
import { TraitToken } from 'src/graphql/traitToken/model/traitToken.model';

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

  @Field(() => [TraitToken])
  backpackTokens: TraitToken[];

  @Field(() => [TraitToken])
  equippedTraitTokens: TraitToken[];

  @Field(() => Int)
  totalFame: number;
}
