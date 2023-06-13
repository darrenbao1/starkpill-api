import { Injectable } from '@nestjs/common';
import { ScalarRemove, ScalarTransfer, Event, Transfer } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { BackPackMetadataWithEquipped } from '../backpackMetadata/model/backpackMetadataWithEquipped.model';
import { UserService } from '../user/user.service';
import { formatTransaction } from '../shared/utils';

@Injectable()
export class TraitTokenService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  private async getTokenDetails(
    rawTrxns: (Event & {
      ScalarTransfer: ScalarTransfer;
      ScalarRemove: ScalarRemove;
      Transfer: Transfer;
    })[],
    tokenId: number,
  ) {
    if (rawTrxns.length !== 0) {
      const latestScalarEvent = rawTrxns[0];
      let owner = '';

      if (latestScalarEvent.eventType === 'SCALAR_REMOVE') {
        owner = latestScalarEvent.to;
      } else if (latestScalarEvent.eventType === 'SCALAR_TRANSFER') {
        const pillEquippingTheTrait = await this.tokenService.findTokenById(
          Number(latestScalarEvent.to),
        );
        owner = pillEquippingTheTrait.owner.address;
      } else if (latestScalarEvent.eventType === 'TRANSFER') {
        owner = latestScalarEvent.to;
      }

      const metadata = await this.tokenService.findBackPackTokenById(tokenId);
      const traitMetadata: BackPackMetadataWithEquipped = {
        ...metadata,
        equippedById:
          latestScalarEvent.eventType === 'SCALAR_REMOVE' ||
          latestScalarEvent.eventType === 'TRANSFER'
            ? 0 // 0 means not equipped
            : Number(latestScalarEvent.to),
      };
      const transactions = rawTrxns.map(formatTransaction);
      return {
        traitTokenid: tokenId,
        transactions,
        owner: { address: owner },
        traitMetadata,
      };
    } else {
      return null;
    }
  }

  async findTraitTokenById(tokenId: number) {
    const transactions = await this.prismaService.event.findMany({
      include: {
        ScalarTransfer: true,
        ScalarRemove: true,
        Transfer: true,
      },
      where: {
        tokenId: tokenId,
        eventType: { in: ['SCALAR_TRANSFER', 'SCALAR_REMOVE', 'TRANSFER'] },
      },

      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });
    return this.getTokenDetails(transactions, tokenId);
  }

  async findTraitTokensById(tokenIds: number[]) {
    const transactions = await this.prismaService.event.findMany({
      include: {
        ScalarTransfer: true,
        ScalarRemove: true,
        Transfer: true,
      },
      where: {
        tokenId: {
          in: tokenIds,
        },
        eventType: { in: ['SCALAR_TRANSFER', 'SCALAR_REMOVE', 'TRANSFER'] },
      },
      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });

    const tokenTransactions = tokenIds.map((tokenId) =>
      transactions.filter((trxn) => trxn.tokenId === tokenId),
    );
    return tokenTransactions.map((trxns) =>
      this.getTokenDetails(trxns, trxns[0].tokenId),
    );
  }

  async findTraitTokensByOwner(owner: string) {
    const transactions = await this.prismaService.event.findMany({
      where: {
        OR: [
          {
            to: {
              equals: owner,
              mode: 'insensitive',
            },
          },
          {
            ScalarTransfer: {
              from: {
                equals: owner,
                mode: 'insensitive',
              },
            },
          },
          {
            Transfer: {
              from: {
                equals: owner,
                mode: 'insensitive',
              },
            },
          },
        ],
        eventType: { in: ['SCALAR_REMOVE', 'SCALAR_TRANSFER', 'TRANSFER'] },
      },
      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });

    const tokensInteractedWithSet: Set<number> = new Set<number>();

    transactions.forEach((transaction) => {
      tokensInteractedWithSet.add(transaction.tokenId);
    });

    const tokenIdsOwned: number[] = [];
    const tokensInteractedWithArr = Array.from(tokensInteractedWithSet);
    const lowercaseAddress = owner.toLowerCase();
    for (const tokenId of tokensInteractedWithArr) {
      // find gets the first trxn in the array, so it's the most recent scalarTransfer/scalarRemove/transfer trxn
      const transaction = transactions.find((trxn) => trxn.tokenId === tokenId);
      //check if there is a mint event, if there isn't it is a trait token
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
        (transaction.eventType === 'SCALAR_REMOVE' &&
          transaction.to === lowercaseAddress) ||
        (transaction.eventType === 'TRANSFER' &&
          !hasMintEvent &&
          transaction.to === lowercaseAddress)
      ) {
        tokenIdsOwned.push(tokenId);
      }
    }

    return await this.findTraitTokensById(tokenIdsOwned);
  }

  async findEquippedTraitTokensByOwner(owner: string) {
    const pillsOwnedByUser = await this.userService
      .findTokenIdsOwnedByUser(owner)
      .then((tokens) => this.tokenService.findTokensById(tokens));
    const ingredientIds = pillsOwnedByUser
      .filter((token) => token.ingredient !== 0)
      .map((token) => token.ingredient);
    const backgroundIds = pillsOwnedByUser
      .filter((token) => token.background !== 0)
      .map((token) => token.background);

    const equippedTraitTokens = await this.findTraitTokensById([
      ...ingredientIds,
      ...backgroundIds,
    ]);
    return equippedTraitTokens;
  }
}
