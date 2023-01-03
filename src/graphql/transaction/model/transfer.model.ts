import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Transfer {
  @Field(() => String)
  mintPrice: string;

  @Field(() => Int)
  background: number;

  @Field(() => Int)
  ingredient: number;

  @Field(() => String)
  from: string;

  @Field(() => String)
  to: string;
}
