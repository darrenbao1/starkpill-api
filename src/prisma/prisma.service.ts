import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  [x: string]: any;
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        'info',
        'warn',
        'error',
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    if (this.configService.get('PRISMA_LOGGING') === 'true') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore

      this.$on('query', async ({ query, params }) => {
        this.logger.log(`${query}, ${params}`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
