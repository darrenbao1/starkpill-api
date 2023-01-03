import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Token } from './model/token.model';

@Resolver()
export class TokenResolver {
  @Query(() => Token)
  async token(
    @Args('address', { type: () => String }) address: string,
  ): Promise<Token> {
    return null;
  }

  @Query(() => [Token])
  async tokens(
    @Args('address', { type: () => String }) address: string,
  ): Promise<Token[]> {
    return null;
  }
}
