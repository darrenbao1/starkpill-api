import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class ScalarTransfer {
  @Field(() => String)
  from: string;

  @Field(() => Int)
  to: number;
}
