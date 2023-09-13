import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommentDto, CreatePostDto, UpdateAccountDto } from './dto';
import { UserService } from 'src/graphql/user/user.service';
import { TraitTokenService } from 'src/graphql/traitToken/traitToken.service';
import { convertToStandardWalletAddress } from 'src/indexing/utils';
import { v2 as cloudinaryV2, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as bycrypt from 'bcrypt';
@Injectable()
export class AccountService {
  constructor(
    private config: ConfigService,
    private prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly traitTokenService: TraitTokenService,
  ) {
    cloudinaryV2.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async updateAccount(
    walletAddress: string,
    updateData: UpdateAccountDto,
  ): Promise<Account> {
    const hasInteractedWithContract = await this.prismaService.event.findFirst({
      where: {
        OR: [
          {
            to: {
              equals: walletAddress,
              mode: 'insensitive',
            },
          },
          {
            Transfer: {
              from: {
                equals: walletAddress,
                mode: 'insensitive',
              },
            },
          },
        ],
        eventType: { in: ['MINT', 'TRANSFER'] },
      },
    });
    //if never interacted with contract, they will not be able to create username and etc
    if (!hasInteractedWithContract) {
      throw new ForbiddenException(
        'This wallet has not interacted with contract once.',
      );
    }
    // Find the user in the database
    const user = await this.prismaService.account.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //check if the user owns the pillId for profile picture
    if (updateData.profilePictureTokenId) {
      const pills = await this.userService.findTokenIdsOwnedByUser(
        walletAddress,
      );
      //if user doesn't own the pill let give exception
      if (!pills.includes(updateData.profilePictureTokenId)) {
        throw new ForbiddenException(
          'This wallet does not own pill: #' + updateData.profilePictureTokenId,
        );
      }
    }

    // Update the user's data with the provided updateData
    const updatedUser = await this.prismaService.account.update({
      where: { walletAddress },
      data: updateData,
    });
    delete updatedUser.walletAddressHash;
    delete updatedUser.id;
    delete updatedUser.createdAt;
    delete updatedUser.updatedAt;
    return updatedUser;
  }

  async getAccountByWalletAddress(walletAddress: string): Promise<Account> {
    return await this.prismaService.account.findFirst({
      where: {
        walletAddress: convertToStandardWalletAddress(walletAddress),
      },
    });
  }

  async followUser(followerId: number, followeeWalletAddress: string) {
    // Use the wallet address to get the account object.
    const followee = await this.getAccountByWalletAddress(
      followeeWalletAddress,
    );
    if (!followee) {
      //create account for followee
      const newAccount = await this.createAccount(followeeWalletAddress);
      const newFollow = await this.prismaService.follow.create({
        data: {
          followerId: followerId,
          followingId: newAccount.id,
        },
      });
      return { message: 'Successfully followed: ' + followeeWalletAddress };
    }
    if (followee.id === followerId) {
      throw new ForbiddenException('User prohibited from following self');
    }

    // Create the follow relationship
    try {
      const follow = await this.prismaService.follow.create({
        data: {
          followerId: followerId,
          followingId: followee.id,
        },
      });
    } catch (error) {
      throw new NotFoundException('Already following this user');
    }
    return { message: 'Successfully followed: ' + followeeWalletAddress };
  }

  async unfollowUser(followerId: number, followeeWalletAddress: string) {
    // Use the wallet address to get the account object.
    const followee = await this.getAccountByWalletAddress(
      followeeWalletAddress,
    );
    if (!followee || followee.id === followerId) {
      throw new NotFoundException(
        'User does not have an account: ' +
          followeeWalletAddress +
          " or can't unfollow self",
      );
    }
    const isExistingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followee.id,
        },
      },
    });

    if (!isExistingFollow) {
      throw new NotFoundException(
        'User is not following .' + followeeWalletAddress,
      );
    }

    await this.prismaService.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followee.id,
        },
      },
    });

    return { message: 'Successfully unfollowed: ' + followeeWalletAddress };
  }

  async removeFollower(ownerId: number, followerWalletAddress: string) {
    // Use the wallet address to get the account object.
    const follower = await this.getAccountByWalletAddress(
      followerWalletAddress,
    );
    if (!follower || follower.id === ownerId) {
      throw new NotFoundException(
        'User does not have an account: ' +
          followerWalletAddress +
          " or can't remove follow self",
      );
    }
    const isExistingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: ownerId,
        },
      },
    });
    if (!isExistingFollow) {
      throw new NotFoundException('User is not following you.');
    }
    await this.prismaService.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: ownerId,
        },
      },
    });

    return {
      message: 'Successfully removed follower: ' + followerWalletAddress,
    };
  }

  async uploadCoverPhoto(
    walletAddress: string,
    file: Express.Multer.File,
    xPos: number,
    yPos: number,
  ) {
    //upload the file to cloudinary using API
    const res: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinaryV2.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            max_file_size: 10 * 1024 * 1024, // max file size here.
            allowed_formats: ['jpg', 'jpeg', 'png'], //file types here.
            folder: walletAddress, //file name
            transformation: [
              {
                crop: 'crop',
                width: 800,
                height: 400,
                x: xPos,
                y: yPos,
              },
            ], //transform to a cover picture dimension. TODO.
          },
          (error: any, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });

    const updatedAccount = await this.prismaService.account.update({
      where: { walletAddress },
      data: {
        coverPictureUrl: res.secure_url,
        pos_x_CoverPicture: xPos,
        pos_y_CoverPicture: yPos,
      },
    });
    return { message: 'Updated Cover Photo' };
  }

  async createPostWithImage(
    walletAddress: string,
    file: Express.Multer.File,
    dto: CreatePostDto,
  ) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //upload the file to cloudinary using API
    const res: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinaryV2.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            max_file_size: 10 * 1024 * 1024, // max file size here.
            allowed_formats: ['jpg', 'jpeg', 'png'], //file types here.
            folder: walletAddress, //file name
          },
          (error: any, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });

    try {
      const newPost = await this.prismaService.post.create({
        data: {
          content: dto.content,
          authorId: account.id,
          image: res.secure_url,
        },
      });
      return newPost;
    } catch (error) {
      throw new InternalServerErrorException('Error creating post');
    }
  }

  async createPostWithoutImage(walletAddress: string, dto: CreatePostDto) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //create the post
    try {
      const newPost = await this.prismaService.post.create({
        data: {
          content: dto.content,
          authorId: account.id,
        },
      });
      return newPost;
    } catch (error) {
      throw new InternalServerErrorException('Error creating post');
    }
  }

  async deletePost(walletAddress: string, postId: number) {
    //check if the user owns the post
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== account.id) {
      throw new ForbiddenException('User does not own this post');
    }
    //delete the post
    try {
      const deletedPost = await this.prismaService.post.delete({
        where: { id: postId },
      });
      return { message: 'Deleted post' };
    } catch (error) {
      throw new InternalServerErrorException('Error deleting post');
    }
  }

  async removeCoverPhoto(walletAddress: string) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    if (!account.coverPictureUrl) {
      throw new NotFoundException('User does not have a cover photo');
    }
    //delete the cover photo
    try {
      const updatedAccount = await this.prismaService.account.update({
        where: { walletAddress },
        data: {
          coverPictureUrl: null,
          pos_x_CoverPicture: null,
          pos_y_CoverPicture: null,
        },
      });
      return { message: 'Removed Cover Photo' };
    } catch (error) {
      throw new InternalServerErrorException('Error removing cover photo');
    }
  }

  async likePost(walletAddress: string, postId: number) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //check if post exists
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    //check if the user has already liked the post
    const hasLiked = await this.prismaService.like.findFirst({
      where: {
        postId: postId,
        accountId: account.id,
      },
    });
    //if they have, throw error
    if (hasLiked) {
      throw new ForbiddenException('User has already liked this post');
    }

    //if they haven't, create the like object
    try {
      const newLike = await this.prismaService.like.create({
        data: {
          postId: postId,
          accountId: account.id,
        },
      });
      return { message: 'Liked post' };
    } catch (error) {
      throw new InternalServerErrorException('Error liking post');
    }
  }

  //unlike post
  async unlikePost(walletAddress: string, postId: number) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //check if post exists
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    //check if the user has already liked the post
    const hasLiked = await this.prismaService.like.findFirst({
      where: {
        postId: postId,
        accountId: account.id,
      },
    });
    //if they have not, throw error
    if (!hasLiked) {
      throw new ForbiddenException('User has not liked this post');
    }
    //if they have, delete the like object
    try {
      const deletedLike = await this.prismaService.like.delete({
        where: {
          id: hasLiked.id,
        },
      });
      return { message: 'Unliked post' };
    } catch (error) {
      throw new InternalServerErrorException('Error unliking post');
    }
  }
  //create comment
  async createComment(
    walletAddress: string,
    postId: number,
    commentDto: CommentDto,
  ) {
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //check if post exists
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    //create the comment
    try {
      const newComment = await this.prismaService.comment.create({
        data: {
          text: commentDto.text,
          authorId: account.id,
          postId: postId,
        },
      });
      return { message: 'Created comment' };
    } catch (error) {
      throw new InternalServerErrorException('Error creating comment');
    }
  }
  //delete comment
  async deleteComment(walletAddress: string, commentId: number) {
    //check if owner of comment
    const account = await this.getAccountByWalletAddress(walletAddress);
    if (!account) {
      throw new NotFoundException('User not found');
    }
    //check if comment exists
    const comment = await this.prismaService.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    //check if user owns comment
    if (comment.authorId !== account.id) {
      throw new ForbiddenException('User does not own this comment');
    }
    //delete the comment
    try {
      const deletedComment = await this.prismaService.comment.delete({
        where: { id: commentId },
      });
      return { message: 'Deleted comment' };
    } catch (error) {
      throw new InternalServerErrorException('Error deleting comment');
    }
  }
  //Create account for user's that are currently not stored in the database.
  async createAccount(address: string) {
    //convert wallet address to standard wallet address
    const walletAddress = convertToStandardWalletAddress(address);
    //check if user exists in accounts table
    const account = await this.prismaService.account.findUnique({
      where: {
        walletAddress: walletAddress,
      },
    });

    if (!account) {
      //generate hash of the wallet address and store in it db.
      const walletAddressHash = await bycrypt.hash(walletAddress, 10);
      //if user does not exist, create a new user in accounts table
      try {
        const newAccount = await this.prismaService.account.create({
          data: {
            walletAddress: walletAddress,
            walletAddressHash: walletAddressHash,
          },
        });
        return newAccount;
      } catch (error) {
        console.log(error);
        return null;
      }
    } else {
      return account;
    }
  }
}
