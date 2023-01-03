import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangeAttribute } from './model/changeAttribute.model';
import { Mint } from './model/mint.model';
import { Transaction } from './model/transaction.model';
import { Transfer } from './model/transfer.model';

@Injectable()
export class TransactionService {
  constructor(private readonly prismaService: PrismaService) {}

  async findTransactionByHash(transactionHash: string): Promise<Transaction> {
    const event = await this.prismaService.event.findUnique({
      where: { transactionHash },
      include: {
        ChangeAttribute: true,
        Mint: true,
        Transfer: true,
      },
    });

    const mint: Mint = event.Mint
      ? event.Mint
      : {
          mintPrice: event.Mint.mintPrice,
          background: event.Mint.background,
          ingredient: event.Mint.ingredient,
          minter,
          mintingAddress: event.to,
        };

    const transfer: Transfer = event.Transfer
      ? event.Transfer
      : {
          from: this.usersService.findUserByAddress(event.Transfer.from),
          to: this.usersService.findUserByAddress(event.Transfer.to),
        };

    const changeAttribute: ChangeAttribute = event.ChangeAttribute
      ? {
          oldBackground: event.ChangeAttribute.oldBackground,
          oldIngredient: event.ChangeAttribute.oldIngredient,
          newBackground: event.ChangeAttribute.newBackground,
          newIngredient: event.ChangeAttribute.newIngredient,
          callee: this.usersService.findUserByAddress(event.to),
        }
      : null;

    return {
      hash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: event.timestamp,
      mint,
      transfer,
      changeAttribute,
    };
  }

  async findTransactionsByHash(
    transactionHashes: string[],
  ): Promise<Transaction[]> {
    return null;
  }
}
