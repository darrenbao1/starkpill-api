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
}
