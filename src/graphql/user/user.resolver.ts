import { Args, Query, Resolver } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  async user(
    @Args('address', { type: () => String }) address: string,
  ): Promise<User> {
    return null;
  }
}
