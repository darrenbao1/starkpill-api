import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/graphql/user/models/user.model';

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

  @Field(() => User)
  callee: User;
}
