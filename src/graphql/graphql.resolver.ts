import { Int, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver()
export class GraphqlResolver {
  constructor(private readonly prismaService: PrismaService) {}

  @Query(() => Int)
  transaction() {
    return this.prismaService.metadata
      .findUnique({ where: { id: 1 } })
      .then((block) => block.lastIndexedBlock);
  }
}
