import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Mint {
  @Field(() => String)
  mintPrice: string;

  @Field(() => Int)
  background: number;

  @Field(() => Int)
  ingredient: number;

  @Field(() => String)
  mintAddress: string;

  @Field(() => String)
  mintingAddress: string;
}
