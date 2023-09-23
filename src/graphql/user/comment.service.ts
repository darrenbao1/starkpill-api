import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Comment } from './models/comment.model';
@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}
  async getCommentById(id: number): Promise<Comment> {
    const result = await this.prismaService.comment.findUnique({
      where: {
        id: id,
      },
      include: {
        author: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    return {
      id: result.id,
      text: result.text,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      authorId: result.authorId,
      authorAddress: result.author.walletAddress,
      postId: result.postId,
    };
  }
}
