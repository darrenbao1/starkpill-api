import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Defame {
  @Field(() => String)
  voter: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Int)
  incrementBy: number;
}
