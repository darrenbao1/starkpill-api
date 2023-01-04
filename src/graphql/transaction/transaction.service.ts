import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  async findTransactionByHash(transactionHash: string) {
    const trxn = await this.prismaService.event.findUnique({
      where: { transactionHash },
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
      },
    });

    if (!trxn) {
      return null;
    }

    return {
      hash: trxn.transactionHash,
      token: trxn.tokenId,
      blockNumber: trxn.blockNumber,
      timestamp: trxn.timestamp,
      transactionType: trxn.eventType,
    };
  }

  async findTransactionsByHash(transactionHashes: string[]) {
    const trxnDetails = Promise.all(
      transactionHashes.map((hash) => this.findTransactionByHash(hash)),
    );

    return trxnDetails;
  }
}
