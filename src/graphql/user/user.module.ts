import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { TraitTokenModule } from '../traitToken/traitToken.module';

@Module({
  imports: [TokenModule, TraitTokenModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
