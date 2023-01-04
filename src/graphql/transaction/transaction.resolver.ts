import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { EventType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
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

  @ResolveField(() => Mint)
  async mint(@Parent() transaction: Transaction) {
    const mintTrxn = await this.prismaService.event.findFirst({
      where: { transactionHash: transaction.hash, eventType: EventType.MINT },
      include: { Mint: true },
    });

    if (!mintTrxn) {
      return null;
    }

    return {
      mintPrice: mintTrxn.Mint.mintPrice.toString(),
      background: mintTrxn.Mint.background,
      ingredient: mintTrxn.Mint.ingredient,
      minter: mintTrxn.to,
    };
  }

  @ResolveField(() => Transfer)
  async transfer(@Parent() transaction: Transaction) {
    const transferTrxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: transaction.hash,
        eventType: EventType.TRANSFER,
      },
      include: { Transfer: true },
    });

    if (!transferTrxn) {
      return null;
    }

    return {
      from: transferTrxn.Transfer.from,
      to: transferTrxn.to,
    };
  }

  @ResolveField(() => ChangeAttribute)
  async changeAttribute(@Parent() transaction: Transaction) {
    const changeAttributeTrxn = await this.prismaService.event.findFirst({
      where: {
        transactionHash: transaction.hash,
        eventType: EventType.CHANGE_ATTRIBUTE,
      },
      include: { ChangeAttribute: true },
    });

    if (!changeAttributeTrxn) {
      return null;
    }

    const { oldBackground, newBackground, oldIngredient, newIngredient } =
      changeAttributeTrxn.ChangeAttribute;

    return {
      callee: changeAttributeTrxn.to,
      oldBackground,
      newBackground,
      oldIngredient,
      newIngredient,
    };
  }
}
