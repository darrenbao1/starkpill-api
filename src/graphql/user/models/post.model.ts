import { Field, GraphQLTimestamp, Int, ObjectType } from '@nestjs/graphql';
import { Comment } from './comment.model';
import { Like } from './like.model';

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

  @Field(() => [String], { nullable: true }) // Use an array of strings for images
  images: string[] | null;

  @Field(() => Int)
  authorId: number;

  @Field(() => String)
  authorAddress: string;

  @Field(() => [Comment])
  comments: Comment[];

  @Field(() => [Like])
  likes: Like[];

  @Field(() => [String])
  likedByAddresses: string[];
}
