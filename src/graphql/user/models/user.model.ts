import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Token } from '../../token/model/token.model';
import { Transaction } from '../../transaction/model/transaction.model';
import { TraitToken } from 'src/graphql/traitToken/model/traitToken.model';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

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

  @Field(() => Date)
  dateJoined: Date;

  @Field(() => [String])
  followers: String[];

  @Field(() => [String])
  following: String[];

  @Field(() => Int)
  followersCount: number;

  @Field(() => Int)
  followingCount: number;

  @Field(() => String, { nullable: true })
  username: string | null;

  @Field(() => String, { nullable: true })
  twitterHandle: string | null;

  @Field(() => String, { nullable: true })
  firstName: string | null;

  @Field(() => String, { nullable: true })
  lastName: string | null;

  @Field(() => String, { nullable: true })
  bio: string | null;

  @Field(() => Int, { nullable: true })
  profilePictureTokenId: number | null;

  @Field(() => String, { nullable: true })
  coverPictureUrl: number | null;

  @Field(() => String, { nullable: true })
  ensDomain: string | null;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => String, { nullable: true })
  websiteUrl: string | null;

  @Field(() => Int, { nullable: true })
  pos_x_CoverPicture: number | null;

  @Field(() => Int, { nullable: true })
  pos_y_CoverPicture: number | null;
}
