import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { Transaction } from './model/transaction.model';
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
  ) {}

  @Query(() => [Transaction])
  async transactions(
    @Args('transactionHashes', { type: () => [String] })
    transactionHashes: string[],
  ): Promise<Transaction[]> {
    return null;
  }
}
