import { Query, Resolver } from '@nestjs/graphql';
import { read } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { PharmacyData } from './model/pharmacyData.model';

@Resolver()
export class PharmacyDataResolver {
  constructor(private readonly PrismaService: PrismaService) {}

  @Query(() => [PharmacyData])
  async getPharmacyData() {
    return this.PrismaService.pharmacyData.findMany();
  }
}
