import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min } from 'class-validator';
import { OrderBy } from './enums';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 100 })
  @Min(1)
  first?: number;

  // For tokens
  @Field(() => OrderBy, { nullable: true, defaultValue: OrderBy.DESC })
  orderBy?: OrderBy;
}
