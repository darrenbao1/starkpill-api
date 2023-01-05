import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../shared/pagination.args';

@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async findTokenById(tokenId: number) {
    const latestChangeAttributeOrMintPromise =
      this.prismaService.event.findFirst({
        include: {
          ChangeAttribute: true,
          Mint: true,
        },
        where: {
          tokenId,
          NOT: {
            eventType: 'TRANSFER',
          },
        },
        orderBy: {
          blockNumber: 'desc',
        },
      });

    // run above promises concurrently as they are independent
    const [owner, mintPrice, transactions, latestChangeAttributeOrMint] =
      await Promise.all([
        this.getOwner(tokenId),
        this.getMintingPrice(tokenId),
        this.getTransactions(tokenId),
        latestChangeAttributeOrMintPromise,
      ]);

    const background =
      latestChangeAttributeOrMint.eventType === 'MINT'
        ? latestChangeAttributeOrMint.Mint.background
        : latestChangeAttributeOrMint.ChangeAttribute.newBackground;

    const ingredient =
      latestChangeAttributeOrMint.eventType === 'MINT'
        ? latestChangeAttributeOrMint.Mint.ingredient
        : latestChangeAttributeOrMint.ChangeAttribute.newIngredient;

    return {
      id: tokenId,
      owner,
      mintPrice,
      transactions,
      background,
      ingredient,
    };
  }

  findTokensById(tokenIds: number[]) {
    return Promise.all(tokenIds.map((tokenId) => this.findTokenById(tokenId)));
  }

  async getOwner(tokenId: number) {
    // mint or transfer transactions
    const latestMintOrTransferPromise =
      await this.prismaService.event.findFirst({
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

    return { address: latestMintOrTransferPromise.to };
  }

  private async getMintingPrice(tokenId: number) {
    const mintTrxn = await this.prismaService.event.findFirst({
      include: {
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

    return mintTrxn?.Mint?.mintPrice.toString();
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
    const tokenIds = await this.prismaService.event.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: {
        timestamp: paginationArgs.orderBy,
      },
      select: {
        tokenId: true,
      },
    });

    const tokenIdsSet = new Set(tokenIds.map((token) => token.tokenId));

    return this.findTokensById(Array.from(tokenIdsSet));
  }
}
