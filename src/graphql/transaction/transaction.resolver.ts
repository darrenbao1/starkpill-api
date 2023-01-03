import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Transaction } from './model/transaction.model';

@Resolver()
export class TransactionResolver {
  @Query(() => Transaction)
  async transaction(
    @Args('address', { type: () => String }) address: string,
  ): Promise<Transaction> {
    return null;
  }

  @Query(() => [Transaction])
  async transactions(
    @Args('address', { type: () => String }) address: string,
  ): Promise<Transaction[]> {
    return null;
  }
}
