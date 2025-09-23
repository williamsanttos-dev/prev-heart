import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HeartBeatDTO {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(220)
  bpm: number;
}

export class HeartBeatResponseDTO {
  bpm: number;
  updatedAt: Date;
}
