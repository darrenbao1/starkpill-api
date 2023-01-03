import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';

@Resolver()
export class UserResolver {
  @Query(() => User)
  async user(
    @Args('address', { type: () => String }) address: string,
  ): Promise<User> {
    return null;
  }
}
