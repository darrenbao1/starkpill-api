import {
  ChangeAttribute,
  Mint,
  Transfer,
  Event,
  Fame,
  Defame,
} from '.prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../shared/pagination.args';
import { formatTransaction } from '../shared/utils';

@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  private getTokenDetails(
    rawTrxns: (Event & {
      Mint: Mint;
      ChangeAttribute: ChangeAttribute;
      Transfer: Transfer;
      Fame: Fame;
      Defame: Defame;
    })[],
    id: number,
  ) {
    try {
      //remove all trxn that has transactionType of Fame and Defame
      const rawTrxnsWithoutFameEvents = rawTrxns.filter(
        (trxn) => trxn.eventType !== 'FAME' && trxn.eventType !== 'DEFAME',
      );
      const fameEvents = rawTrxns.filter((trxn) => trxn.eventType === 'FAME');
      const defameEvents = rawTrxns.filter(
        (trxn) => trxn.eventType === 'DEFAME',
      );
      let fame = 0;
      //check if there is any Fame or Defame events
      if (fameEvents.length != 0) {
        fame = fameEvents[0].Fame.amount;
      }
      let defame = 0;
      if (defameEvents.length != 0) {
        defame = defameEvents[0].Defame.amount;
      }
      const owner = rawTrxnsWithoutFameEvents[0].to; // get the first trxn as it's sorted in descending order

      const latestChangeAttributeOrMint = rawTrxns.find(
        (trxn) =>
          trxn.eventType === 'MINT' || trxn.eventType === 'CHANGE_ATTRIBUTE',
      );
      const background =
        latestChangeAttributeOrMint.eventType === 'MINT'
          ? latestChangeAttributeOrMint.Mint.background
          : latestChangeAttributeOrMint.ChangeAttribute.newBackground;
      const ingredient =
        latestChangeAttributeOrMint.eventType === 'MINT'
          ? latestChangeAttributeOrMint.Mint.ingredient
          : latestChangeAttributeOrMint.ChangeAttribute.newIngredient;

      const transactions = rawTrxns.map(formatTransaction);

      return {
        id,
        owner: { address: owner },
        transactions,
        background,
        ingredient,
        fame,
        defame,
      };
    } catch (error) {
      console.log(error);
      const tokenId = rawTrxns[0]?.tokenId || null;
      const transactions = rawTrxns.map(formatTransaction);
      return {
        id: tokenId,
        owner: { address: null },
        transactions,
        background: null,
        ingredient: null,
        fame: null,
        defame: null,
      };
    }
  }

  async findTokenById(tokenId: number) {
    const transactions = await this.prismaService.event.findMany({
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
        Fame: true,
        Defame: true,
      },
      where: { tokenId: tokenId },
      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });

    return this.getTokenDetails(transactions, tokenId);
  }

  async findTokensById(tokenIds: number[]) {
    const transactions = await this.prismaService.event.findMany({
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
        Fame: true,
        Defame: true,
      },
      where: {
        tokenId: {
          in: tokenIds,
        },
      },
      orderBy: [{ blockNumber: 'desc' }, { eventIndex: 'desc' }],
    });

    // each sub array contains all transactions for a token, sorted by block number  in descending order
    const tokenTransactions = tokenIds.map((tokenId) =>
      transactions.filter((trxn) => trxn.tokenId === tokenId),
    );

    return tokenTransactions.map((trxns) =>
      this.getTokenDetails(trxns, trxns[0].tokenId),
    );
  }
  async findAllTokensForSourceOfTruth() {
    const tokenIds = await this.prismaService.mint.findMany({
      include: {
        event: true,
      },
    });
    return this.findTokensById(tokenIds.map((token) => token.event.tokenId));
  }

  async findAllTokens(paginationArgs: PaginationArgs) {
    const tokenIds = await this.prismaService.tokenMetadata.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: [
        {
          mintPrice: 'desc',
        },
        {
          id: 'asc',
        },
      ],
    });
    return this.findTokensById(tokenIds.map((token) => token.id));
  }
  async findAllTokensByHighestFame(paginationArgs: PaginationArgs) {
    const tokenIds = await this.prismaService.tokenMetadata.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: [
        {
          fame: 'desc',
        },
        {
          id: 'asc',
        },
      ],
    });
    return this.findTokensById(tokenIds.map((token) => token.id));
  }
  //find all tokens by lowest fame
  async findAllTokensByLowestFame(paginationArgs: PaginationArgs) {
    const tokenIds = await this.prismaService.tokenMetadata.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: [
        {
          fame: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });
    return this.findTokensById(tokenIds.map((token) => token.id));
  }

  //find all tokens by lowest fame
  async findAllTokensByLatest(paginationArgs: PaginationArgs) {
    const tokenIds = await this.prismaService.tokenMetadata.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: [
        {
          id: 'desc',
        },
      ],
    });
    return this.findTokensById(tokenIds.map((token) => token.id));
  }

  async findMetadataByTokenId(id: number) {
    const metadata = await this.prismaService.tokenMetadata.findFirst({
      where: { id },
    });

    return {
      ...metadata,
      mintPrice: metadata.mintPrice.toString(),
    };
  }

  //back pack functions
  async findBackPackTokenById(tokenId: number) {
    const backpackToken = await this.prismaService.backpackMetadata.findFirst({
      where: { id: tokenId },
    });
    return backpackToken;
  }

  async findBackPackTokensById(tokenIds: number[]) {
    const backpackTokens = await this.prismaService.backpackMetadata.findMany({
      where: {
        id: {
          in: tokenIds,
        },
      },
    });

    return backpackTokens;
  }
  async findBackPackTokens(address: string) {
    const backpackTokensIds = await this.prismaService.backpack.findMany({
      where: { ownerAddress: address },
    });
    return this.findBackPackTokensById(
      backpackTokensIds.map((token) => token.id),
    );
  }
  async checkIsClaimed(
    contract_address: string,
    tokenIds: number[],
  ): Promise<boolean[]> {
    const results: boolean[] = await Promise.all(
      tokenIds.map(async (tokenId) => {
        // Check against TraitRedemption table for each tokenId and contract_address
        const traitRedemption =
          await this.prismaService.traitRedemption.findMany({
            where: {
              l1_address: contract_address,
              l1_tokenId: tokenId,
            },
          });

        return traitRedemption.length > 0; // Return true if there are matching records, false otherwise
      }),
    );

    return results;
  }

  async getTotalFameOfPills(tokenIds: number[]) {
    const result = await this.findTokensById(tokenIds);
    const fame = result.map((token) => {
      if (token.fame !== null) {
        return token.fame;
      }
    });
    const defame = result.map((token) => {
      if (token.defame !== null) {
        return token.defame;
      }
    });
    const totalFame = fame.reduce((a, b) => a + b, 0);
    const totalDefame = defame.reduce((a, b) => a + b, 0);
    return totalFame - totalDefame;
  }

  async getVotingPower(tokenIds: number[]) {
    const cutOffTime = new Date(
      Date.now() - 24 * 60 * 60 * 1000 - 10 * 60 * 1000,
    );
    await this.prismaService.votingBooth.deleteMany({
      where: { time_Stamp: { lt: cutOffTime } },
    });
    const result = await this.findTokensById(tokenIds);
    const backgroundNumbers = result.map((token) => {
      if (token.background !== 0) {
        return token.background;
      }
    });
    const ingredientNumbers = result.map((token) => {
      if (token.ingredient !== 0) {
        return token.ingredient;
      }
    });
    const hasVotingPowerIds =
      await this.prismaService.votingPowerIds.findMany();
    const remainingVotes = await this.prismaService.votingBooth.findMany();
    const allTokenIds = [
      ...backgroundNumbers,
      ...ingredientNumbers,
      ...tokenIds,
    ];
    const filteredTokenIds = allTokenIds.filter((tokenId) =>
      hasVotingPowerIds.some(
        (votingPowerId) => votingPowerId.tokenId === tokenId,
      ),
    );
    const finalTokenIds = filteredTokenIds.filter((tokenId) =>
      remainingVotes.every((vote) => vote.tokenId !== tokenId),
    );
    return finalTokenIds.length;
  }
}
