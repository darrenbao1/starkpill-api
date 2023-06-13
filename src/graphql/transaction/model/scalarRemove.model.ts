import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class ScalarRemove {
  @Field(() => Int)
  from: number;

  @Field(() => String)
  to: string;
}
