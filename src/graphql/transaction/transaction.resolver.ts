import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionType } from '../shared/enums';
import { GraphqlFields } from '../shared/graphql-fields.decorator';
import { PaginationArgs } from '../shared/pagination.args';
import { Token } from '../token/model/token.model';
import { TokenService } from '../token/token.service';
import { ChangeAttribute } from './model/changeAttribute.model';
import { Mint } from './model/mint.model';
import { Transaction } from './model/transaction.model';
import { Transfer } from './model/transfer.model';
import { TransactionService } from './transaction.service';
import { Fame } from './model/fame.model';
import { Defame } from './model/defame.model';
import { ScalarTransfer } from './model/scalarTransfer.model';
import { ScalarRemove } from './model/scalarRemove.model';

@Resolver(() => Transaction)
export class TransactionResolver {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly tokenService: TokenService,
  ) {}

  @Query(() => Transaction)
  async transaction(
    @Args('transactionHash', { type: () => String }) transactionHash: string,
  ) {
    return this.transactionService.findTransactionByHash(transactionHash);
  }

  @Query(() => [Transaction])
  async transactions(
    @Args('transactionHashes', { type: () => [String] })
    transactionHashes: string[],
  ) {
    return this.transactionService.findTransactionsByHash(transactionHashes);
  }

  // Order by sorts by date
  @Query(() => [Transaction])
  async allTransactions(@Args() paginationArgs: PaginationArgs) {
    return this.transactionService.findAllTransactions(paginationArgs);
  }

  @ResolveField(() => Mint)
  async mint(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.MINT,
    );
  }

  @ResolveField(() => Transfer)
  async transfer(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.TRANSFER,
    );
  }

  @ResolveField(() => ChangeAttribute)
  async changeAttribute(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.CHANGE_ATTRIBUTE,
    );
  }

  @ResolveField(() => Fame)
  async fame(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.FAME,
    );
  }

  @ResolveField(() => Defame)
  async defame(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.DEFAME,
    );
  }

  @ResolveField(() => ScalarTransfer)
  async scalarTransfer(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.SCALAR_TRANSFER,
    );
  }

  @ResolveField(() => ScalarRemove)
  async scalarRemove(@Parent() transaction: Transaction) {
    return this.transactionService.findSpecificTransactions(
      transaction,
      TransactionType.SCALAR_REMOVE,
    );
  }

  @ResolveField(() => Token)
  async token(
    @Parent() transaction: Transaction,
    @GraphqlFields() fields: string[],
  ) {
    if (fields.length === 1 && fields[0] === 'id') {
      return transaction.token;
    }

    return this.tokenService.findTokenById(transaction.token.id);
  }

  @ResolveField(() => Number)
  async fameAmount(@Parent() transaction: Transaction) {
    if (transaction.transactionType !== TransactionType.FAME) {
      return 0;
    }
    const transactionWithFame = await this.prismaService.event.findFirst({
      where: {
        transactionHash: transaction.hash,
        eventIndex: transaction.eventIndex,
      },
      include: {
        Fame: true,
      },
    });
    const allFameTxForPill = await this.prismaService.event.findMany({
      where: {
        tokenId: transaction.token.id,
        eventType: 'FAME',
      },
      orderBy: [{ blockNumber: 'asc' }, { eventIndex: 'asc' }],
      include: {
        Fame: true,
      },
    });
    //find the index of the transaction in allFameTxForPill
    const index = allFameTxForPill.findIndex(
      (tx) =>
        tx.transactionHash === transaction.hash &&
        tx.eventIndex === transaction.eventIndex,
    );
    if (index === -1) {
      throw new Error('Transaction not found in allFameTxForPill');
    }
    if (index === 0) {
      return transactionWithFame.Fame.amount;
    }
    if (index > 0) {
      return (
        transactionWithFame.Fame.amount -
        allFameTxForPill[index - 1].Fame.amount
      );
    }
  }

  @ResolveField(() => Number)
  async defameAmount(@Parent() transaction: Transaction) {
    if (transaction.transactionType !== TransactionType.DEFAME) {
      return 0;
    }
    const transactionWithDefame = await this.prismaService.event.findFirst({
      where: {
        transactionHash: transaction.hash,
        eventIndex: transaction.eventIndex,
      },
      include: {
        Defame: true,
      },
    });
    const allFameTxForPill = await this.prismaService.event.findMany({
      where: {
        tokenId: transaction.token.id,
        eventType: 'DEFAME',
      },
      orderBy: [{ blockNumber: 'asc' }, { eventIndex: 'asc' }],
      include: {
        Defame: true,
      },
    });
    //find the index of the transaction in allFameTxForPill
    const index = allFameTxForPill.findIndex(
      (tx) =>
        tx.transactionHash === transaction.hash &&
        tx.eventIndex === transaction.eventIndex,
    );
    if (index === -1) {
      throw new Error('Transaction not found in allFameTxForPill');
    }
    if (index === 0) {
      return transactionWithDefame.Defame.amount;
    }
    if (index > 0) {
      return (
        transactionWithDefame.Defame.amount -
        allFameTxForPill[index - 1].Defame.amount
      );
    }
  }
}
