import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';
import { AppController } from './app.controller';
import { GraphqlModule } from './graphql/graphql.module';
import { PrismaModule } from './prisma/prisma.module';
import { BlocksModule } from './queues/blocks/blocks.module';
import { QueuesModule } from './queues/queues.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
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
    AuthModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
