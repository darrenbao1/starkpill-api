import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/graphql/user/models/user.model';
import { BackPackMetadataWithEquipped } from 'src/graphql/backpackMetadata/model/backpackMetadataWithEquipped.model';
import { Transaction } from 'src/graphql/transaction/model/transaction.model';
@ObjectType()
export class TraitToken {
  @Field(() => Int)
  traitTokenid: number;

  @Field(() => User)
  owner: User;

  @Field(() => BackPackMetadataWithEquipped)
  traitMetadata: BackPackMetadataWithEquipped;

  @Field(() => [Transaction])
  transactions: Transaction[];
}
