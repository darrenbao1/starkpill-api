import { ChangeAttribute, Mint, Transfer, Event } from '.prisma/client';
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
    })[],
    id: number,
  ) {
    const owner = rawTrxns[rawTrxns.length - 1].to;
    const mintPrice = rawTrxns
      .find((trxn) => trxn.eventType === 'MINT')
      .Mint.mintPrice.toString();

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
