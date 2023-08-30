import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UserModule } from 'src/graphql/user/user.module';
import { TraitTokenModule } from 'src/graphql/traitToken/traitToken.module';

@Module({
  controllers: [AccountController],
  providers: [AccountService],
  imports: [UserModule, TraitTokenModule],
})
export class AccountModule {}
