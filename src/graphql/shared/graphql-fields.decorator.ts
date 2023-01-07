import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { fieldsList } from 'graphql-fields-list';

export const GraphqlFields = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const graphqlContext = GqlExecutionContext.create(context);
    const info = graphqlContext.getInfo();
    return fieldsList(info);
  },
);
