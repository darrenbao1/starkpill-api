import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Account } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { AccountService } from './account.service';
import {
  CommentDto,
  CreatePostDto,
  FollowDto,
  UpdateAccountDto,
  UploadCoverPhotoDto,
} from './dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { validate } from 'class-validator';

@UseGuards(AuthGuard('jwt'))
@Controller('account')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Patch('updateInfo')
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

  @Post('removeFollower')
  async removeFollower(@GetUser() owner: Account, @Body() body: FollowDto) {
    return await this.accountService.removeFollower(
      owner.id,
      body.walletAddress,
    );
  }

  @Post('uploadCoverPhoto')
  @UseInterceptors(FileInterceptor('image'))
  async updateCoverPhoto(
    @GetUser() account: Account,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const uploadCoverPhotoDto = new UploadCoverPhotoDto();
    uploadCoverPhotoDto.xPos = Number(body.xPos);
    uploadCoverPhotoDto.yPos = Number(body.yPos);

    const validationErrors = await validate(uploadCoverPhotoDto);

    if (validationErrors.length > 0) {
      // Handle validation errors
      return { message: 'Validation failed', errors: validationErrors };
    }

    return await this.accountService.uploadCoverPhoto(
      account.walletAddress,
      file,
      uploadCoverPhotoDto.xPos,
      uploadCoverPhotoDto.yPos,
    );
  }
  //remove cover photo route
  @Delete('removeCoverPhoto')
  async removeCoverPhoto(@GetUser() account: Account) {
    return await this.accountService.removeCoverPhoto(account.walletAddress);
  }
  //TODO ADD GIFS?
  @Post('createPost')
  @UseInterceptors(FilesInterceptor('images', 5)) // Allow up to 5 files (adjust as needed)
  async createPost(
    @GetUser() account: Account,
    @UploadedFiles() files: Express.Multer.File[], // Use UploadedFiles decorator
    @Body() body: any,
  ) {
    // Manually validate the body data using class-validator decorators
    const createPostDto = new CreatePostDto();
    createPostDto.content = body.content;

    const validationErrors = await validate(createPostDto);

    if (validationErrors.length > 0) {
      // Handle validation errors
      return { message: 'Validation failed', errors: validationErrors };
    }

    if (!files || files.length === 0) {
      return await this.accountService.createPostWithoutImage(
        account.walletAddress,
        createPostDto,
      );
    }

    return await this.accountService.createPostWithImages(
      account.walletAddress,
      files,
      createPostDto,
    );
  }

  @Delete('deletePost/:postId')
  async deletePost(
    @GetUser() account: Account,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.accountService.deletePost(account.walletAddress, postId);
  }

  @Post('likePost/:postId')
  async likePost(
    @GetUser() account: Account,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.accountService.likePost(account.walletAddress, postId);
  }
  //unlike post
  @Delete('unlikePost/:postId')
  async unlikePost(
    @GetUser() account: Account,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.accountService.unlikePost(account.walletAddress, postId);
  }

  //create comment for post
  //TODO ALLOW EMOJIS
  @Post('createComment/:postId')
  async createComment(
    @GetUser() account: Account,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() commentDto: CommentDto,
  ) {
    return await this.accountService.createComment(
      account.walletAddress,
      postId,
      commentDto,
    );
  }
  //delete comment for post
  @Delete('deleteComment/:commentId')
  async deleteComment(
    @GetUser() account: Account,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return await this.accountService.deleteComment(
      account.walletAddress,
      commentId,
    );
  }
}
