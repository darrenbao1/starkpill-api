import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaginationArgs } from '../shared/pagination.args';
import { Transaction } from '../transaction/model/transaction.model';
import { Token } from './model/token.model';
import { TokenService } from './token.service';

@Resolver(() => Token)
export class TokenResolver {
  constructor(private readonly tokenService: TokenService) {}

  @Query(() => Token)
  async token(@Args('tokenId', { type: () => Int }) tokenId: number) {
    return this.tokenService.findTokenById(tokenId);
  }

  @Query(() => [Token])
  async tokens(@Args('tokenIds', { type: () => [Int] }) tokenIds: number[]) {
    return this.tokenService.findTokensById(tokenIds);
  }

  // Order by sorts by mint price
  @Query(() => [Token])
  async allTokens(@Args() paginationArgs: PaginationArgs) {
    return this.tokenService.findAllTokens(paginationArgs);
  }

  @ResolveField(() => [Transaction])
  async transactions(@Parent() token: Token) {
    return this.tokenService.getTransactions(token.id);
  }
}
