import { Module, forwardRef } from '@nestjs/common';
import { TraitTokenResolver } from './traitToken.resolver';
import { TraitTokenService } from './traitToken.service';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TokenModule, forwardRef(() => UserModule)],
  providers: [TraitTokenResolver, TraitTokenService],
  exports: [TraitTokenService],
})
export class TraitTokenModule {}
