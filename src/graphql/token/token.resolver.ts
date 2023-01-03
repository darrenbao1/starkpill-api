import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Token } from './model/token.model';
import { TokenService } from './token.service';

@Resolver()
export class TokenResolver {
  constructor(private readonly tokenService: TokenService) {}

  @Query(() => Token)
  async token(
    @Args('tokenId', { type: () => Int }) tokenId: string,
  ): Promise<Token> {
    return this.tokenService.findTokenById(tokenId);
  }

  @Query(() => [Token])
  async tokens(
    @Args('tokenIds', { type: () => [Int] }) tokenIds: string,
  ): Promise<Token[]> {
    return null;
  }
}
