import { ArgsType, Field, GraphQLISODateTime, Int } from '@nestjs/graphql';
import { MAX, Max, Min } from 'class-validator';
import { OrderBy } from './enums';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 100 })
  @Min(1)
  first?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  cursor?: Date;

  // For tokens
  @Field(() => OrderBy, { nullable: true, defaultValue: OrderBy.DESC })
  orderBy?: OrderBy;
}
