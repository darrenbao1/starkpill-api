import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../shared/enums';
import { PaginationArgs } from '../shared/pagination.args';
import { formatTransaction } from '../shared/utils';
import { Transaction } from './model/transaction.model';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  async findTransactionByHash(transactionHash: string) {
    const trxn = await this.prismaService.event.findMany({
      where: { transactionHash },
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
        Fame: true,
        Defame: true,
      },
    });

    if (!trxn) {
      throw new BadRequestException({
        error: 'Invalid transaction hash',
      });
    }
    //map through trxn and format each and return
    return trxn.map((trans) => formatTransaction(trans));
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
        Fame: true,
        Defame: true,
      },
    });

    return transactionHashes
      .map((trxnHash) =>
        trxns.find((trxn) => trxn.transactionHash === trxnHash),
      )
      .map(formatTransaction);
  }

  async findAllTransactions(paginationArgs: PaginationArgs) {
    const trxn = await this.prismaService.event.findMany({
      take: paginationArgs.first,
      skip: paginationArgs.skip,
      orderBy: {
        timestamp: paginationArgs.orderBy,
      },
    });

    return trxn.map(formatTransaction);
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
        eventIndex: transaction.eventIndex,
      },
      include: {
        Transfer: transactionType === TransactionType.TRANSFER,
        Mint: transactionType === TransactionType.MINT,
        ChangeAttribute: transactionType === TransactionType.CHANGE_ATTRIBUTE,
        Fame: transactionType === TransactionType.FAME,
        Defame: transactionType === TransactionType.DEFAME,
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

      case TransactionType.FAME:
        return {
          ...trxn.Fame,
          callee: { address: trxn.to },
        };

      case TransactionType.DEFAME:
        return {
          ...trxn.Defame,
          callee: { address: trxn.to },
        };

      default:
        return null;
    }
  }
}
