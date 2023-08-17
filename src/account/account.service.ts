import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAccountDto } from './dto';
import { UserService } from 'src/graphql/user/user.service';
import { TraitTokenService } from 'src/graphql/traitToken/traitToken.service';
import { convertToStandardWalletAddress } from 'src/indexing/utils';

@Injectable()
export class AccountService {
  constructor(
    private prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly traitTokenService: TraitTokenService,
  ) {}

  async updateAccount(
    walletAddress: string,
    updateData: UpdateAccountDto,
  ): Promise<Account> {
    const hasInteractedWithContract = await this.prismaService.event.findFirst({
      where: {
        OR: [
          {
            to: {
              equals: walletAddress,
              mode: 'insensitive',
            },
          },
          {
            Transfer: {
              from: {
                equals: walletAddress,
                mode: 'insensitive',
              },
            },
          },
        ],
        eventType: { in: ['MINT', 'TRANSFER'] },
      },
    });
    //if never interacted with contract, they will not be able to create username and etc
    if (!hasInteractedWithContract) {
      throw new ForbiddenException(
        'This wallet has not interacted with contract once.',
      );
    }
    // Find the user in the database
    const user = await this.prismaService.account.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //check if the user owns the pillId for profile picture
    if (updateData.profilePictureTokenId) {
      const pills = await this.userService.findTokenIdsOwnedByUser(
        walletAddress,
      );
      //if user doesn't own the pill let give exception
      if (!pills.includes(updateData.profilePictureTokenId)) {
        throw new ForbiddenException(
          'This wallet does not own pill: #' + updateData.profilePictureTokenId,
        );
      }
    }

    //check if the user owns the backgroundId for cover picture
    if (updateData.coverPictureTokenId) {
      const traitTokens = await Promise.all(
        await this.traitTokenService.findTraitTokensByOwner(walletAddress),
      );
      const equippedTraitTokens = await Promise.all(
        await this.traitTokenService.findEquippedTraitTokensByOwner(
          walletAddress,
        ),
      );
      //concat array
      const combinedTokens = [...traitTokens, ...equippedTraitTokens];
      //map through combinedTokens and only return those that in the metadata have isIngredient = false
      const backgroundTokens = combinedTokens.filter(
        (token) => token.traitMetadata.isIngredient === false,
      );

      //check if updateData.coverPictureTokenId is in backgroundTokens
      const backgroundTokenIds = backgroundTokens.map(
        (token) => token.traitTokenid,
      );
      //if user doesn't own the background let give exception
      if (!backgroundTokenIds.includes(updateData.coverPictureTokenId)) {
        throw new ForbiddenException(
          'This wallet does not own background: #' +
            updateData.coverPictureTokenId,
        );
      }
    }
    // Update the user's data with the provided updateData
    const updatedUser = await this.prismaService.account.update({
      where: { walletAddress },
      data: updateData,
    });
    delete updatedUser.walletAddressHash;
    delete updatedUser.id;
    delete updatedUser.createdAt;
    delete updatedUser.updatedAt;
    return updatedUser;
  }

  async getAccountByWalletAddress(walletAddress: string): Promise<Account> {
    return await this.prismaService.account.findUnique({
      where: {
        walletAddress: convertToStandardWalletAddress(walletAddress),
      },
    });
  }

  async followUser(followerId: number, followeeWalletAddress: string) {
    try {
      // Use the wallet address to get the account object.
      const followee = await this.getAccountByWalletAddress(
        followeeWalletAddress,
      );

      if (!followee) {
        throw new NotFoundException('User to follow not found.');
      }

      // Create the follow relationship
      const follow = await this.prismaService.follow.create({
        data: {
          followerId: followerId,
          followingId: followee.id,
        },
      });

      return { message: 'Successfully followed: ' + followeeWalletAddress };
    } catch (error) {
      // Handle the error appropriately, such as logging it or throwing a custom exception.
      throw new InternalServerErrorException(
        'User is already following: ' + followeeWalletAddress,
      );
    }
  }

  async unfollowUser(followerId: number, followeeWalletAddress: string) {
    // Use the wallet address to get the account object.
    const followee = await this.getAccountByWalletAddress(
      followeeWalletAddress,
    );
    if (!followee) {
      throw new NotFoundException(
        'User does not have an account: ' + followeeWalletAddress,
      );
    }
    const isExistingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followee.id,
        },
      },
    });

    if (!isExistingFollow) {
      throw new NotFoundException(
        'User is not following .' + followeeWalletAddress,
      );
    }

    await this.prismaService.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followee.id,
        },
      },
    });

    return { message: 'Successfully unfollowed: ' + followeeWalletAddress };
  }
}
