import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async findTokenById(tokenId: number) {
    // mint or transfer transactions
    const latestMintOrTransfer = await this.prismaService.event.findFirst({
      include: {
        Transfer: true,
      },
      where: {
        tokenId,
        NOT: {
          eventType: 'CHANGE_ATTRIBUTE',
        },
      },
      orderBy: {
        blockNumber: 'desc',
      },
    });

    const owner = latestMintOrTransfer?.to;

    const mintTrxn = await this.prismaService.event.findFirst({
      include: {
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

    const mintPrice = mintTrxn?.Mint?.mintPrice;

    const allTrxn = await this.prismaService.event.findMany({
      include: {
        Transfer: true,
        ChangeAttribute: true,
        Mint: true,
      },
      where: {
        tokenId,
      },
    });

    return {
      id: tokenId,
      owner,
      mintPrice,
      transactions: allTrxn,
    };
  }
}
