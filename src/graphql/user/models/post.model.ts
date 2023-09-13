import { Field, GraphQLTimestamp, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Post {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLTimestamp)
  createdAt: Date;

  @Field(() => GraphQLTimestamp)
  updatedAt: Date;

  @Field(() => String)
  content: string;

  @Field(() => String)
  image: string;

  @Field(() => Int)
  authorId: number;
}
