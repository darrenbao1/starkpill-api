import { Field, GraphQLTimestamp, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Comment {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLTimestamp)
  createdAt: Date;

  @Field(() => GraphQLTimestamp)
  updatedAt: Date;

  @Field(() => String)
  text: string;

  @Field(() => Int)
  postId: number;

  @Field(() => Int)
  authorId: number;

  @Field(() => String)
  authorAddress: string;
}
