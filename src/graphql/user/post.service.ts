import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}
  async getLikedByAddresses(postId: number): Promise<string[]> {
    const likes = await this.prismaService.like.findMany({
      where: {
        postId: postId,
      },
      include: {
        account: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    return likes.map((like) => like.account.walletAddress);
  }
}
