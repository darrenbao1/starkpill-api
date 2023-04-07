import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Metadata } from '../metadata/model/metadata.model';
import { PaginationArgs } from '../shared/pagination.args';
import { Token } from './model/token.model';
import { TokenService } from './token.service';
import { BackPackMetadata } from '../backpackMetadata/model/backpackMetadata.model';

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
  // order by highest fame
  @Query(() => [Token])
  async allTokensByHighestFame(@Args() paginationArgs: PaginationArgs) {
    return this.tokenService.findAllTokensByHighestFame(paginationArgs);
  }
  // order by latest pill
  @Query(() => [Token])
  async allTokensByLatest(@Args() paginationArgs: PaginationArgs) {
    return this.tokenService.findAllTokensByLatest(paginationArgs);
  }
  @ResolveField(() => Metadata)
  async metadata(@Parent() token: Token) {
    return this.tokenService.findMetadataByTokenId(token.id);
  }

  @Query(() => [BackPackMetadata])
  async ownerBackpack(
    @Args('ownerAddress', { type: () => String }) ownerAddress: string,
  ) {
    return this.tokenService.findBackPackTokens(ownerAddress);
  }

}
