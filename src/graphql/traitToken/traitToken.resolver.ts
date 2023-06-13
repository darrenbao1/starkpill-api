import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { TraitToken } from './model/traitToken.model';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../user/models/user.model';
import { TraitTokenService } from './traitToken.service';
import { TokenService } from '../token/token.service';

@Resolver(() => TraitToken)
export class TraitTokenResolver {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly traitTokenService: TraitTokenService,
    private readonly tokenService: TokenService,
  ) {}
  @Query(() => TraitToken)
  async traitToken(@Args('traitTokenId', { type: () => Int }) tokenId: number) {
    return this.traitTokenService.findTraitTokenById(tokenId);
  }
  @Query(() => [TraitToken])
  async traitTokens(
    @Args('traitTokenIds', { type: () => [Int] }) tokenIds: number[],
  ) {
    return this.traitTokenService.findTraitTokensById(tokenIds);
  }
}
