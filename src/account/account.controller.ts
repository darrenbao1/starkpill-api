import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Account } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { AccountService } from './account.service';
import { FollowDto, UpdateAccountDto } from './dto';

@UseGuards(AuthGuard('jwt'))
@Controller('account')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Patch('me')
  async updateAccount(
    @GetUser() account: Account,
    @Body() updateData: UpdateAccountDto,
  ): Promise<Account> {
    return this.accountService.updateAccount(account.walletAddress, updateData);
  }

  @Post('follow')
  async follow(@GetUser() follower: Account, @Body() body: FollowDto) {
    return await this.accountService.followUser(
      follower.id,
      body.walletAddress,
    );
  }

  @Post('unfollow')
  async unfollow(@GetUser() follower: Account, @Body() body: FollowDto) {
    return await this.accountService.unfollowUser(
      follower.id,
      body.walletAddress,
    );
  }
}
