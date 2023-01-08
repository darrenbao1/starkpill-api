import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Metadata {
  @Field(() => String)
  description: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => String)
  ingredient: string;

  @Field(() => String)
  background: string;

  @Field(() => String)
  mintPrice: string;
}
