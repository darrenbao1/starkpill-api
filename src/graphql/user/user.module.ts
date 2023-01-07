import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [TokenModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
