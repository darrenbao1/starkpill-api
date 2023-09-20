import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { TraitTokenModule } from '../traitToken/traitToken.module';
import { PostModule } from './post.module';

@Module({
  imports: [TokenModule, TraitTokenModule, PostModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
