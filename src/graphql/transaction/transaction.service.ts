import { BadRequestException, Injectable } from '@nestjs/common';
import { ChangeAttribute, Mint, Transfer, Event } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../shared/enums';
import { PaginationArgs } from '../shared/pagination.args';
import { Transaction } from './model/transaction.model';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  private formatTransaction(
    trxn: Event & {
      ChangeAttribute: ChangeAttribute;
      Mint: Mint;
      Transfer: Transfer;
    },
  ) {
    return {
      hash: trxn.transactionHash,
      blockNumber: trxn.blockNumber,
      timestamp: trxn.timestamp,
      transactionType: trxn.eventType,
      token: { id: trxn.tokenId },
    };
  }

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

    return this.formatTransaction(trxn);
  }

  async findTransactionsByHash(transactionHashes: string[]) {
    const trxns = await this.prismaService.event.findMany({
      where: {
        transactionHash: {
          in: transactionHashes,
        },
      },
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
      },
    });

    return transactionHashes
      .map((trxnHash) =>
        trxns.find((trxn) => trxn.transactionHash === trxnHash),
      )
      .map(this.formatTransaction);
  }

  async findAllTransactions(paginationArgs: PaginationArgs) {
    const trxn = await this.prismaService.event.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: {
        timestamp: paginationArgs.orderBy,
      },
    });

    return trxn.map(this.formatTransaction);
  }

  async findSpecificTransactions(
    transaction: Transaction,
    transactionType: TransactionType,
  ) {
    if (transaction.transactionType !== transactionType) {
      return null;
    }

    const trxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: { equals: transaction.hash, mode: 'insensitive' },
        eventType: transactionType,
      },
      include: {
        Transfer: transactionType === TransactionType.TRANSFER,
        Mint: transactionType === TransactionType.MINT,
        ChangeAttribute: transactionType === TransactionType.CHANGE_ATTRIBUTE,
      },
    });

    if (!trxn) {
      return null;
    }

    switch (transactionType) {
      case TransactionType.MINT:
        return {
          mintPrice: trxn.Mint.mintPrice.toString(),
          background: trxn.Mint.background,
          ingredient: trxn.Mint.ingredient,
          minter: { address: trxn.to },
        };

      case TransactionType.TRANSFER:
        return {
          from: { address: trxn.Transfer.from },
          to: { address: trxn.to },
        };

      case TransactionType.CHANGE_ATTRIBUTE:
        return {
          ...trxn.ChangeAttribute,
          callee: { address: trxn.to },
        };

      default:
        return null;
    }
  }
}
