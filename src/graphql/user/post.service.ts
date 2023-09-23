import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Post } from './models/post.model';
@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}
  async getPostById(id: number): Promise<Post> {
    const result = await this.prismaService.post.findUnique({
      where: {
        id: id,
      },
      include: {
        comments: {
          include: {
            author: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
        likes: {
          include: {
            account: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
        images: true,
        author: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    return {
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      authorId: result.authorId,
      authorAddress: result.author.walletAddress,
      comments: result.comments.map((comment) => ({
        ...comment,
        authorAddress: comment.author.walletAddress,
      })),
      likes: result.likes,
      likedByAddresses: result.likes.map((like) => like.account.walletAddress),
      images: result.images.map((image) => image.url),
    };
  }
}
