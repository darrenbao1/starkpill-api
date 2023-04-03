import { Module } from '@nestjs/common';
import { PharmacyDataResolver } from './pharmacyData.resolver';

@Module({
  providers: [PharmacyDataResolver],
})
export class PharmacyDataModule {}
