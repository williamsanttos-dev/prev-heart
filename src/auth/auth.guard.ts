import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}
  canActivate(context: ExecutionContext): boolean {
    const secretKey = process.env.SECRET_ACCESS_TOKEN;
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('Token not found');

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, secretKey);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
