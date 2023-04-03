import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PharmacyData {
  @Field(() => Number)
  typeIndex: number;

  @Field(() => Number)
  index: number;

  @Field(() => Number)
  startAmount: number;

  @Field(() => Number)
  amount_left: number;
}
