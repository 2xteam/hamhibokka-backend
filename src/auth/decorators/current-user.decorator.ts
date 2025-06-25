import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // GraphQL 컨텍스트에서 사용자 정보 추출
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    
    return request.user?.userId || request.user;
  },
);