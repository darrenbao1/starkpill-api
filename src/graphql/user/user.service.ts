import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByAddress(address: string) {
    const transactions = await this.prismaService.event.findMany({
      where: {
        to: {
          equals: address,
          mode: 'insensitive',
        },
      },
      include: {
        Transfer: true,
      },
    });

    const trxnHashes = transactions.map((trxn) => ({
      hash: trxn.transactionHash,
    }));

    const tokenIds = await this.findTokenIdsOwnedByUser(address);

    return {
      address,
      tokens: tokenIds,
      transactions: trxnHashes,
    };
  }

  async findTokenIdsOwnedByUser(address: string): Promise<number[]> {
    const transactions = await this.prismaService.event.findMany({
      where: {
        to: {
          equals: address,
          mode: 'insensitive',
        },
        NOT: {
          eventType: 'CHANGE_ATTRIBUTE',
        },
      },
      orderBy: {
        blockNumber: 'desc',
      },
    });

    const tokensInteractedWithSet: Set<number> = new Set<number>();

    transactions.forEach((transaction) => {
      tokensInteractedWithSet.add(transaction.tokenId);
    });

    const tokenIdsOwned: number[] = [];
    const tokensInteractedWithArr = Array.from(tokensInteractedWithSet);

    const lowercaseAddress = address.toLowerCase();

    for (const tokenId of tokensInteractedWithArr) {
      // find gets the first trxn in the array, so it's the most recent one
      const transaction = transactions.find((trxn) => trxn.tokenId === tokenId);

      if (
        transaction.eventType === 'MINT' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      } else if (
        transaction.eventType === 'TRANSFER' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      }
    }

    return tokenIdsOwned;
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

    return transactions.map((trxn) => trxn.transactionHash);
  }
}
