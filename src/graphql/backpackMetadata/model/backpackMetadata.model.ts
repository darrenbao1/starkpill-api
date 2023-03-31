import { Field, Int, ObjectType } from '@nestjs/graphql';
import { number } from 'starknet';

@ObjectType()
export class BackPackMetadata {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  description: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => Boolean)
  isIngredient: Boolean;

  @Field(() => String)
  itemName: string;
}
