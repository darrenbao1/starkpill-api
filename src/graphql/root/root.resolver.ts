import { Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class RootResolver {
  @Query(() => String)
  query(): string {
    return 'query';
  }

  @Mutation(() => String)
  mutation(): string {
    return 'mutation';
  }
}
