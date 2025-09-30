import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HeartBeatDTO {
  @ApiProperty({
    example: 72,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(220)
  bpm: number;
}

export class HeartBeatResponseDTO {
  @ApiProperty({ example: 72 })
  bpm: number;

  @ApiProperty({ example: '2025-09-08T17:25:18.805Z' })
  updatedAt: Date;
}
