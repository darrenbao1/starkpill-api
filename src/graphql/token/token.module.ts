import { Module } from '@nestjs/common';
import { TokenResolver } from './token.resolver';

@Module({
  providers: [TokenResolver],
})
export class TokenModule {}
