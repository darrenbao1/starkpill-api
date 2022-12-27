import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppController } from './app.controller';
import { GraphqlModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        createClient: () => new Redis(configService.get('QUEUE_REDIS_URL')),
      }),
      inject: [ConfigService],
    }),
    GraphqlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
