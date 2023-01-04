import { Module } from '@nestjs/common';
import { TokenResolver } from './token.resolver';
import { TokenService } from './token.service';

@Module({
  providers: [TokenResolver, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
