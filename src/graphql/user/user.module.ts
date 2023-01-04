import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [TokenModule, TransactionModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
