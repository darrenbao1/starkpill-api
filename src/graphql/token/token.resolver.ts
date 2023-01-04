import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Transaction } from '../transaction/model/transaction.model';
import { User } from '../user/models/user.model';
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

  @ResolveField(() => [Transaction])
  async transactions(@Parent() token: Token) {
    return this.tokenService.getTransactions(token.id);
  }

  @ResolveField(() => User)
  async owner(@Parent() token: Token) {
    return this.tokenService.getOwner(token.id);
  }
}
