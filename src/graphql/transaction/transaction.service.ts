import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../shared/pagination.args';

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
      throw new BadRequestException({
        error: 'Invalid transaction hash',
      });
    }

    return {
      hash: trxn.transactionHash,
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

  async getTokenForTransaction(hash: string) {
    const trxn = await this.prismaService.event.findUnique({
      where: {
        transactionHash: hash,
      },
      select: {
        tokenId: true,
      },
    });

    if (!trxn) {
      throw new BadRequestException({
        error: 'Invalid transaction hash',
      });
    }

    return trxn.tokenId;
  }

  async findAllTransactions(paginationArgs: PaginationArgs) {
    const trxn = await this.prismaService.event.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: {
        timestamp: paginationArgs.orderBy,
      },
    });

    return trxn.map((trxn) => ({
      hash: trxn.transactionHash,
      blockNumber: trxn.blockNumber,
      timestamp: trxn.timestamp,
      transactionType: trxn.eventType,
    }));
  }
}
