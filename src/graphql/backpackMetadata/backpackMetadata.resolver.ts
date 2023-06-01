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
  async refreshBackPackMetadataForOneToken(
    @Args('tokenId', { type: () => Int }) tokenId: number,
  ) {
    await this.backpackMetadataService.queueIndexMetadata(tokenId);
    return 'Queued metadata refresh';
  }

  @Mutation(() => String)
  async refreshBackPackMetadataForAllTokens() {
    await this.backpackMetadataService.queueGetAllMetadata();
    return 'Queued metadata refresh';
  }
  @Mutation(() => String)
  async refreshBackPackMetadataForMissingTokens() {
    await this.backpackMetadataService.queueGetMissingMetadata();
    return 'Queued metadata refresh';
  }
  @Query(() => [Int])
  async tokenIdsWithMissingMetadata() {
    const result = await this.backpackMetadataService.getMissingMetadata();
    return result;
  }
}
