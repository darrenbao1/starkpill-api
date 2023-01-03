import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class ChangeAttribute {
  @Field(() => Int)
  oldBackground: string;

  @Field(() => Int)
  oldIngredient: number;

  @Field(() => Int)
  newBackground: number;

  @Field(() => Int)
  newIngredient: number;

  @Field(() => String)
  calleeAddress: string;
}
