import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    CanActivate,
  } from '@nestjs/common';
  import { GqlExecutionContext } from '@nestjs/graphql';
  import { JwtService } from '@nestjs/jwt';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req;
      const token = this.extractTokenFromHeader(request);
  
      // console.log('JWT 토큰:', token);
      // console.log('JWT_SECRET:', this.jwtService['options']?.secret);
  
      if (!token) {
        throw new UnauthorizedException('토큰이 필요합니다.');
      }
  
      try {
        const payload = this.jwtService.verify(token);
        request.user = payload;
        return true;
      } catch (error) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
    }
  
    private extractTokenFromHeader(request: any): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
  