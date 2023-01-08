import { Module } from '@nestjs/common';
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RootModule } from './root/root.module';
import { TokenModule } from './token/token.module';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';
import { MetadataModule } from './metadata/metadata.module';

@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      debug: false,
      playground: false,
    }),
    RootModule,
    TokenModule,
    TransactionModule,
    UserModule,
    MetadataModule,
  ],
  providers: [],
})
export class GraphqlModule {}
