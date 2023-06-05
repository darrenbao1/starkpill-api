import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { MetadataService } from 'src/queues/metadata/metadata.service';

@Resolver()
export class MetadataResolver {
  constructor(
    private readonly metadataService: MetadataService,
    private readonly prismaService: PrismaService,
  ) {}

  @Mutation(() => String)
  async refreshMetadataForOneToken(
    @Args('tokenId', { type: () => Int }) tokenId: number,
  ) {
    await this.metadataService.queueIndexMetadata(tokenId);
    return 'Queued metadata refresh';
  }

  @Mutation(() => String)
  async refreshMetadataForAllTokens() {
    await this.metadataService.queueGetAllMetadata();
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
  @Query(() => [Int])
  async getAllTokenIdsNotPresentInMetadata() {
    const result = await this.metadataService.getTokenIdsWithNoMetaData();
    return result;
  }
  @Query(() => [Int])
  async getTokenIdsThatImageIsWrong() {
    const result = await this.metadataService.getTokensIdsThatImageIsWrong();
    return result;
  }
}
