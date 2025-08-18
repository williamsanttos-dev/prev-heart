import { Request } from 'express';
import { JwtPayloadDTO } from '../dto/Jwt-payload';

export interface AuthenticatedRequest extends Request {
  user: JwtPayloadDTO;
}
