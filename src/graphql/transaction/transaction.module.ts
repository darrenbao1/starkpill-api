import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { TransactionResolver } from './transaction.resolver';
import { TransactionService } from './transaction.service';

@Module({
  imports: [TokenModule],
  providers: [TransactionResolver, TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
