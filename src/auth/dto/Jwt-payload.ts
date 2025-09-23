import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class JwtPayloadDTO {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsString()
  role: 'admin' | 'elder' | 'caregiver';
}
