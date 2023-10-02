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
import { BackPackMetadataWithEquipped } from '../backpackMetadata/model/backpackMetadataWithEquipped.model';
import { TraitToken } from '../traitToken/model/traitToken.model';
import { TraitTokenService } from '../traitToken/traitToken.service';
import { Post } from './models/post.model';
import { PostService } from './post.service';
import { PaginationArgs } from '../shared/pagination.args';
@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly traitTokenService: TraitTokenService,
    private readonly postService: PostService,
  ) {}

  @Query(() => User)
  user(@Args('address', { type: () => String }) address: string) {
    return { address };
  }

  @Query(() => [BackPackMetadataWithEquipped])
  async getEquippedIngredients(
    @Args('address', { type: () => String }) address: string,
  ) {
    const tokensIdsOwned = await this.userService.findTokenIdsOwnedByUser(
      address,
    );
    const pillsOwnedByUser = await this.tokenService.findTokensById(
      tokensIdsOwned,
    );
    let equippedIngredients: BackPackMetadataWithEquipped[] = [];

    await Promise.all(
      pillsOwnedByUser.map(async (pill) => {
        if (pill.ingredient != null && pill.ingredient != 0) {
          const metadata = await this.tokenService.findBackPackTokenById(
            pill.ingredient,
          );
          const resultObject: BackPackMetadataWithEquipped = {
            id: metadata.id,
            description: metadata.description,
            imageUrl: metadata.imageUrl,
            isIngredient: metadata.isIngredient,
            itemName: metadata.itemName,
            equippedById: pill.id,
          };

          equippedIngredients.push(resultObject);
        }
      }),
    );
    return equippedIngredients;
  }
  @Query(() => [BackPackMetadataWithEquipped])
  async getEquippedBackgrounds(
    @Args('address', { type: () => String }) address: string,
  ) {
    const tokensIdsOwned = await this.userService.findTokenIdsOwnedByUser(
      address,
    );
    const pillsOwnedByUser = await this.tokenService.findTokensById(
      tokensIdsOwned,
    );
    let equipppedBackgrounds: BackPackMetadataWithEquipped[] = [];

    await Promise.all(
      pillsOwnedByUser.map(async (pill) => {
        if (pill.background != null && pill.background != 0) {
          const metadata = await this.tokenService.findBackPackTokenById(
            pill.background,
          );
          const resultObject: BackPackMetadataWithEquipped = {
            id: metadata.id,
            description: metadata.description,
            imageUrl: metadata.imageUrl,
            isIngredient: metadata.isIngredient,
            itemName: metadata.itemName,
            equippedById: pill.id,
          };

          equipppedBackgrounds.push(resultObject);
        }
      }),
    );
    return equipppedBackgrounds;
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

  @ResolveField(() => Int)
  async getVotingPower(@Parent() user: User) {
    const tokensIdsOwned = await this.userService.findTokenIdsOwnedByUser(
      user.address,
    );
    const votingPower = await this.tokenService.getVotingPower(tokensIdsOwned);
    return votingPower;
  }

  @ResolveField(() => [TraitToken])
  async backpackTokens(@Parent() user: User) {
    return await this.traitTokenService.findTraitTokensByOwner(user.address);
  }

  @ResolveField(() => [TraitToken])
  async equippedTraitTokens(@Parent() user: User) {
    //TODO
    return await this.traitTokenService.findEquippedTraitTokensByOwner(
      user.address,
    );
  }

  @ResolveField(() => Int)
  async totalFame(@Parent() user: User) {
    const pills = await this.userService.findTokenIdsOwnedByUser(user.address);
    return await this.tokenService.getTotalFameOfPills(pills);
  }

  @ResolveField(() => Date)
  async dateJoined(@Parent() user: User) {
    const firstTransaction = await this.userService.findFirstTransactionByUser(
      user.address,
    );
    return firstTransaction.timestamp;
  }

  @ResolveField(() => [String])
  async followers(@Parent() user: User) {
    return this.userService.getFollowers(user.address);
  }

  @ResolveField(() => Int)
  async followersCount(@Parent() user: User) {
    return this.userService.getFollowersCount(user.address);
  }

  @ResolveField(() => [String])
  async following(@Parent() user: User) {
    return this.userService.getFollowing(user.address);
  }

  @ResolveField(() => Int)
  async followingCount(@Parent() user: User) {
    return this.userService.getFollowingCount(user.address);
  }

  @ResolveField(() => String, { nullable: true })
  async username(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'username');
  }

  @ResolveField(() => String, { nullable: true })
  async twitterHandle(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'twitterHandle');
  }

  @ResolveField(() => String, { nullable: true })
  async firstName(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'firstName');
  }

  @ResolveField(() => String, { nullable: true })
  async lastName(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'lastName');
  }

  @ResolveField(() => String, { nullable: true })
  async bio(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'bio');
  }

  @ResolveField(() => Int, { nullable: true })
  async profilePictureTokenId(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(
      user.address,
      'profilePictureTokenId',
    );
  }

  @ResolveField(() => String, { nullable: true })
  async coverPictureUrl(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'coverPictureUrl');
  }

  @ResolveField(() => String, { nullable: true })
  async ensDomain(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'ensDomain');
  }

  @ResolveField(() => String, { nullable: true })
  async location(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'location');
  }

  @ResolveField(() => String, { nullable: true })
  async websiteUrl(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'websiteUrl');
  }

  @ResolveField(() => Int, { nullable: true })
  async pos_x_CoverPicture(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'pos_x_CoverPicture');
  }

  @ResolveField(() => Int, { nullable: true })
  async pos_y_CoverPicture(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'pos_y_CoverPicture');
  }

  @ResolveField(() => Int, { nullable: true })
  async id(@Parent() user: User): Promise<string | null> {
    return this.userService.getAccountInfo(user.address, 'id');
  }

  @ResolveField(() => [Post])
  async posts(@Parent() user: User): Promise<Post[]> {
    const postsIds = await this.userService.getPosts(user.address);
    return await Promise.all(
      postsIds.map(async (post) => {
        return this.postService.getPostById(post);
      }),
    );
  }
  @Query(() => [Post])
  async getPostsForUser(
    @Args() paginationArgs: PaginationArgs,
    @Args('walletAddress') walletAddress: string,
  ) {
    const postsIds = await this.userService.getPostsForUser(
      paginationArgs,
      walletAddress,
    );
    return await Promise.all(
      postsIds.map(async (post) => {
        return this.postService.getPostById(post);
      }),
    );
  }
}
