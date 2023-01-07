import { ChangeAttribute, Mint, Transfer, Event } from '.prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../shared/pagination.args';
@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  private getTokenDetails(
    transactions: (Event & {
      Mint: Mint;
      ChangeAttribute: ChangeAttribute;
      Transfer: Transfer;
    })[],
    id: number,
  ) {
    const owner = transactions[transactions.length - 1].to;
    const mintPrice = transactions
      .find((trxn) => trxn.eventType === 'MINT')
      .Mint.mintPrice.toString();
    const latestChangeAttributeOrMint = transactions.find(
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

    return {
      id,
      owner,
      mintPrice,
      transactions,
      background,
      ingredient,
    };
  }

  async findTokenById(tokenId: number) {
    const transactions = await this.prismaService.event.findMany({
      include: { ChangeAttribute: true, Mint: true, Transfer: true },
      where: { tokenId: tokenId },
      orderBy: { blockNumber: 'desc' },
    });

    return this.getTokenDetails(transactions, tokenId);
  }

  async findTokensById(tokenIds: number[]) {
    const transactions = await this.prismaService.event.findMany({
      include: { ChangeAttribute: true, Mint: true, Transfer: true },
      where: {
        tokenId: {
          in: tokenIds,
        },
      },
      orderBy: { blockNumber: 'desc' },
    });

    // each sub array contains all transactions for a token, sorted by block number  in descending order
    const tokenTransactions = tokenIds.map((tokenId) =>
      transactions.filter((trxn) => trxn.tokenId === tokenId),
    );

    return tokenTransactions.map((trxns) =>
      this.getTokenDetails(trxns, trxns[0].tokenId),
    );
  }

  async getOwner(tokenId: number) {
    // mint or transfer transactions
    const latestMintOrTransfer = await this.prismaService.event.findFirst({
      include: {
        Transfer: true,
      },
      where: {
        tokenId,
        NOT: {
          eventType: 'CHANGE_ATTRIBUTE',
        },
      },
      orderBy: {
        blockNumber: 'desc',
      },
    });

    if (!latestMintOrTransfer) {
      throw new BadRequestException({
        error: 'Invalid tokenId',
      });
    }

    return { address: latestMintOrTransfer?.to };
  }

  async getTransactions(tokenId: number) {
    const allTrxn = await this.prismaService.event.findMany({
      include: {
        Transfer: true,
        ChangeAttribute: true,
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

    return allTrxn.map((trxn) => ({
      hash: trxn.transactionHash,
      // tokenId is placed in a nested object to match the schema so it triggers the @ResolveField in token.resolver
      token: { id: trxn.tokenId },
      blockNumber: trxn.blockNumber,
      timestamp: trxn.timestamp,
      transactionType: trxn.eventType,
    }));
  }

  // Find all tokens that have been minted
  async findAllTokens(paginationArgs: PaginationArgs) {
    const tokenIds = await this.prismaService.mint.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: {
        mintPrice: paginationArgs.orderBy,
      },
      include: {
        event: true,
      },
    });

    return this.findTokensById(tokenIds.map((token) => token.event.tokenId));
  }
}
