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
import { TransactionService } from '../transaction/transaction.service';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly transactionsService: TransactionService,
  ) {}

  @Query(() => User)
  user(@Args('address', { type: () => String }) address: string) {
    return this.userService.findUserByAddress(address);
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

    const tokens = await this.tokenService.findTokensById(tokensIdsOwned);

    return tokens.map((token) => ({
      id: token.id,
      transactions: token.transactions,
      owner: { address: token.owner },
      mintPrice: token.mintPrice,
      background: token.background,
      ingredient: token.ingredient,
    }));
  }

  @ResolveField(() => [Transaction])
  async transactions(@Parent() user: User) {
    const trxnIds = await this.userService.findTransactionsByUser(user.address);
    return this.transactionsService.findTransactionsByHash(trxnIds);
  }
}
