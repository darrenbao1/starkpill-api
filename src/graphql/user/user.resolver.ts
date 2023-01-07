import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Token } from '../token/model/token.model';
import { TokenService } from '../token/token.service';
import { Transaction } from '../transaction/model/transaction.model';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  @Query(() => User)
  user(@Args('address', { type: () => String }) address: string) {
    return { address };
  }

  @ResolveField(() => Int)
  async numberOfTokensOwned(@Parent() user: User) {
    const tokens = await this.userService.findTokenIdsOwnedByUser(user.address);
    return tokens.length;
  }

  @ResolveField(() => [Token])
  async tokens(@Parent() user: User) {
    const tokensIdsOwned = await this.userService.findTokenIdsOwnedByUser(
      user.address,
    );

    return this.tokenService.findTokensById(tokensIdsOwned);
  }

  @ResolveField(() => [Transaction])
  transactions(@Parent() user: User) {
    return this.userService.findTransactionsByUser(user.address);
  }
}
