import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppController } from './app.controller';
import { GraphqlModule } from './graphql/graphql.module';
import { BlocksModule } from './queues/blocks/blocks.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        createClient: () =>
          new Redis(configService.get('QUEUE_REDIS_URL'), {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }),
      }),
      inject: [ConfigService],
    }),
    GraphqlModule,
    BlocksModule,
    QueuesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
