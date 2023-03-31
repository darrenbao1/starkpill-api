import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackpackMetadataService } from 'src/queues/backpackMetadata/backpackMetadata.service';

@Resolver()
export class BackpackMetadataResolver {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly backpackMetadataService: BackpackMetadataService,
  ) {}

  @Mutation(() => String)
  async refreshMetadataForOneToken(
    @Args('tokenId', { type: () => Int }) tokenId: number,
  ) {
    await this.backpackMetadataService.queueIndexMetadata(tokenId);
    return 'Queued metadata refresh';
  }

  @Mutation(() => String)
  async refreshMetadataForAllTokens() {
    await this.backpackMetadataService.queueGetAllMetadata();
    return 'Queued metadata refresh';
  }

  @Query(() => Int)
  async lastIndexedBlock() {
    const { lastIndexedBlock } = await this.prismaService.metadata.findUnique({
      where: { id: 1 },
      select: { lastIndexedBlock: true },
    });

    return lastIndexedBlock;
  }
}
