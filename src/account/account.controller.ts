import {
  Body,
  Controller,
  ForbiddenException,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Account } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto';

@Controller('account')
export class AccountController {
  constructor(private accountService: AccountService) {}
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateAccount(
    @GetUser() account: Account,
    @Body() updateData: UpdateAccountDto,
  ): Promise<Account> {
    return this.accountService.updateAccount(account.walletAddress, updateData);
  }
}
