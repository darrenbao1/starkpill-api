import { Module } from '@nestjs/common';
import { TransactionModule } from '../transaction/transaction.module';
import { TokenResolver } from './token.resolver';
import { TokenService } from './token.service';

@Module({
  imports: [TransactionModule],
  providers: [TokenResolver, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
