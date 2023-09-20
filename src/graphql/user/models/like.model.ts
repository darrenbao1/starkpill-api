import { Field, GraphQLTimestamp, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Like {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLTimestamp)
  createdAt: Date;

  @Field(() => GraphQLTimestamp)
  updatedAt: Date;

  @Field(() => Int)
  postId: number;

  @Field(() => Int)
  accountId: number;
}
