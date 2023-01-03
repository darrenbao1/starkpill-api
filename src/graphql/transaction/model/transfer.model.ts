import { Field, ObjectType, Int } from '@nestjs/graphql';
import { User } from 'src/graphql/user/models/user.model';

@ObjectType()
export class Transfer {
  @Field(() => String)
  mintPrice: string;

  @Field(() => Int)
  background: number;

  @Field(() => Int)
  ingredient: number;

  @Field(() => User)
  from: User;

  @Field(() => User)
  to: User;
}
