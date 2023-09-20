import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { formatTransaction } from '../shared/utils';
import { convertToStandardWalletAddress } from 'src/indexing/utils';
@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  async findTokenIdsOwnedByUser(address: string): Promise<number[]> {
    const transactions = await this.prismaService.event.findMany({
      where: {
        OR: [
          {
            to: {
              equals: address,
              mode: 'insensitive',
            },
          },
          {
            Transfer: {
              from: {
                equals: address,
                mode: 'insensitive',
              },
            },
          },
        ],
        eventType: { in: ['MINT', 'TRANSFER'] },
      },
      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });

    const tokensInteractedWithSet: Set<number> = new Set<number>();

    transactions.forEach((transaction) => {
      tokensInteractedWithSet.add(transaction.tokenId);
    });

    const tokenIdsOwned: number[] = [];
    const tokensInteractedWithArr = Array.from(tokensInteractedWithSet);

    const lowercaseAddress = address.toLowerCase();

    for (const tokenId of tokensInteractedWithArr) {
      // find gets the first trxn in the array, so it's the most recent mint/transfer trxn
      const transaction = transactions.find((trxn) => trxn.tokenId === tokenId);

      // Check if there is a mint event for the token ID if no, means it is not a pill. this has mint has issue. need to fix
      const hasMintEvent = await this.prismaService.event.findFirst({
        where: {
          AND: [
            {
              tokenId: {
                equals: tokenId,
              },
            },
            //event type is MINT
            {
              eventType: {
                equals: 'MINT',
              },
            },
          ],
        },
      });

      if (
        hasMintEvent &&
        transaction.eventType === 'MINT' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      }
      // If the last relevant trxn is a transfer and it was transferred to the user, add it.
      else if (
        hasMintEvent &&
        transaction.eventType === 'TRANSFER' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      } // If the tokenId was not added above, it means that the last trxn is a transfer out so don't include it
    }

    return tokenIdsOwned;
  }

  async findFirstTransactionByUser(address: string) {
    const transaction = await this.prismaService.event.findFirst({
      where: {
        OR: [
          {
            to: {
              equals: address,
              mode: 'insensitive',
            },
          },
          {
            Transfer: {
              from: {
                equals: address,
                mode: 'insensitive',
              },
            },
          },
        ],
        eventType: { in: ['MINT', 'TRANSFER'] },
      },
      orderBy: [{ blockNumber: 'asc' }, { eventIndex: 'asc' }],
    });

    return formatTransaction(transaction);
  }

  async findTransactionsByUser(address: string) {
    const transactions = await this.prismaService.event.findMany({
      where: {
        OR: [
          {
            to: {
              equals: address,
              mode: 'insensitive',
            },
          },
          {
            Transfer: {
              from: {
                equals: address,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        Transfer: true,
      },
    });

    return transactions.map(formatTransaction);
  }

  async getAccountByWalletAddress(walletAddress: string) {
    return await this.prismaService.account.findUnique({
      where: {
        walletAddress: convertToStandardWalletAddress(walletAddress),
      },
    });
  }

  async getFollowers(address: string) {
    //Get accountId using wallet address
    const userAccount = await this.getAccountByWalletAddress(address);
    if (userAccount === null) {
      return [];
    }
    const followers = await this.prismaService.account.findMany({
      where: {
        following: {
          some: {
            followingId: userAccount.id,
          },
        },
      },
      select: {
        walletAddress: true,
      },
    });

    return followers.map((user) => user.walletAddress);
  }

  async getFollowersCount(address: string) {
    const userAccount = await this.getAccountByWalletAddress(address);
    if (userAccount === null) {
      return 0;
    }
    const followers = await this.prismaService.account.findMany({
      where: {
        following: {
          some: {
            followingId: userAccount.id,
          },
        },
      },
      select: {
        walletAddress: true,
      },
    });

    return followers.length;
  }

  async getFollowing(address: string) {
    //Get accountId using wallet address
    const userAccount = await this.getAccountByWalletAddress(address);
    if (userAccount === null) {
      return [];
    }
    const following = await this.prismaService.account.findMany({
      where: {
        followedBy: {
          some: {
            followerId: userAccount.id,
          },
        },
      },
      select: {
        walletAddress: true, // Select the walletAddress field only
      },
    });

    return following.map((user) => user.walletAddress);
  }

  async getFollowingCount(address: string) {
    //Get accountId using wallet address
    const userAccount = await this.getAccountByWalletAddress(address);
    if (userAccount === null) {
      return 0;
    }
    const following = await this.prismaService.account.findMany({
      where: {
        followedBy: {
          some: {
            followerId: userAccount.id,
          },
        },
      },
      select: {
        walletAddress: true, // Select the walletAddress field only
      },
    });

    return following.length;
  }

  async getAccountInfo(address: string, attributeName: string) {
    const userAccount = await this.getAccountByWalletAddress(address);
    if (userAccount === null) {
      return null;
    }

    if (attributeName in userAccount) {
      const attributeValue = (userAccount as any)[attributeName];
      return attributeValue !== null ? attributeValue : null;
    } else {
      throw new Error(`Attribute '${attributeName}' not found.`);
    }
  }

  async getPosts(address: string) {
    const userAccount = await this.getAccountByWalletAddress(address);

    if (userAccount === null) {
      return [];
    }

    const postsIds = await this.prismaService.post.findMany({
      where: {
        authorId: userAccount.id,
      },
      select: {
        id: true,
      },
    });

    return postsIds.map((post) => post.id);
  }
}
