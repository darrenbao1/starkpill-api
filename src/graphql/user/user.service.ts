import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Token } from '../token/model/token.model';
import { Transaction } from '../transaction/model/transaction.model';
import { User } from './models/user.model';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByAddress(address: string) {
    const transactions = await this.prismaService.event.findMany({
      where: {
        OR: [
          {
            to: address,
            Transfer: {
              from: address,
            },
          },
        ],
      },
      include: {
        Transfer: true,
      },
    });

    const tokenIds: number[] = await this.findTokenIdsOwnedByUser(address);

    return {
      address,
      tokenIds,
      transactions,
    };
  }

  async findTokenIdsOwnedByUser(address: string): Promise<number[]> {
    const transactions = await this.prismaService.event.findMany({
      include: {
        Transfer: true,
      },
      where: {
        OR: [
          {
            to: address,
          },
          {
            Transfer: {
              from: address,
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

    const tokensInteractedWith: Set<number> = new Set<number>();

    transactions.forEach((transaction) => {
      tokensInteractedWith.add(transaction.tokenId);
    });

    const tokenIdsOwned: number[] = [];

    for (const tokenId of tokensInteractedWith) {
      // find gets the first trxn in the array, so it's the most recent one
      const transaction = transactions.find((trxn) => trxn.tokenId === tokenId);

      if (transaction.eventType === 'MINT' && transaction.to === address) {
        tokenIdsOwned.push(tokenId);
      } else if (
        transaction.eventType === 'TRANSFER' &&
        transaction.to === address
      ) {
        tokenIdsOwned.push(tokenId);
      }
    }

    return tokenIdsOwned;
  }
}
