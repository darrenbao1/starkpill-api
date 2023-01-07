import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { formatTransaction } from '../shared/utils';

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
      // find gets the first trxn in the array, so it's the most recent mint/transfer trxn
      const transaction = transactions.find((trxn) => trxn.tokenId === tokenId);

      // If the last relevant trxn is a mint, add it. This means that the token was not transferred after minting
      if (
        transaction.eventType === 'MINT' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      }
      // If the last relevant trxn is a transfer and it was transferred to the user, add it.
      else if (
        transaction.eventType === 'TRANSFER' &&
        transaction.to === lowercaseAddress
      ) {
        tokenIdsOwned.push(tokenId);
      } // If the tokenId was not added above, it means that the last trxn is a transfer out so don't include it
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

    return transactions.map(formatTransaction);
  }
}
