import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
  ) {}

  async findTokenById(tokenId: number) {
    // mint or transfer transactions
    const latestMintOrTransferPromise = this.prismaService.event.findFirst({
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

    const mintTrxnPromise = this.prismaService.event.findFirst({
      include: {
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

    const allTrxnPromise = this.prismaService.event.findMany({
      include: {
        Transfer: true,
        ChangeAttribute: true,
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

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
    const [
      latestMintOrTransfer,
      mintTrxn,
      allTrxn,
      latestChangeAttributeOrMint,
    ] = await Promise.all([
      latestMintOrTransferPromise,
      mintTrxnPromise,
      allTrxnPromise,
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

    const transactions = (
      await this.transactionService.findTransactionsByHash(
        allTrxn.map((trxn) => trxn.transactionHash),
      )
    ).map((trxn) => ({ hash: trxn.hash }));

    return {
      id: tokenId,
      owner: latestMintOrTransfer?.to,
      mintPrice: mintTrxn?.Mint?.mintPrice.toString(),
      transactions,
      background,
      ingredient,
    };
  }

  findTokensById(tokenIds: number[]) {
    return Promise.all(tokenIds.map((tokenId) => this.findTokenById(tokenId)));
  }
}
