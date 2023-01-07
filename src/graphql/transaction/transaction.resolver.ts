import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { EventType } from '@prisma/client';
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
    if (transaction.transactionType !== TransactionType.MINT) {
      return null;
    }

    const mintTrxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: { equals: transaction.hash, mode: 'insensitive' },
        eventType: EventType.MINT,
      },
      include: { Mint: true },
    });

    if (!mintTrxn) {
      return null;
    }

    return {
      mintPrice: mintTrxn.Mint.mintPrice.toString(),
      background: mintTrxn.Mint.background,
      ingredient: mintTrxn.Mint.ingredient,
      minter: { address: mintTrxn.to },
    };
  }

  @ResolveField(() => Transfer)
  async transfer(@Parent() transaction: Transaction) {
    if (transaction.transactionType !== TransactionType.TRANSFER) {
      return null;
    }

    const transferTrxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: { equals: transaction.hash, mode: 'insensitive' },
        eventType: EventType.TRANSFER,
      },
      include: { Transfer: true },
    });

    if (!transferTrxn) {
      return null;
    }

    return {
      from: { address: transferTrxn.Transfer.from },
      to: { address: transferTrxn.to },
    };
  }

  @ResolveField(() => ChangeAttribute)
  async changeAttribute(@Parent() transaction: Transaction) {
    if (transaction.transactionType !== TransactionType.CHANGE_ATTRIBUTE) {
      return null;
    }

    const changeAttributeTrxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: { equals: transaction.hash, mode: 'insensitive' },
        eventType: EventType.CHANGE_ATTRIBUTE,
      },
      include: { ChangeAttribute: true },
    });

    if (!changeAttributeTrxn) {
      return null;
    }

    return {
      ...changeAttributeTrxn.ChangeAttribute,
      callee: { address: changeAttributeTrxn.to },
    };
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
}
