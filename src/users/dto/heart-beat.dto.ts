import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class HeartBeatDTO {
  @Type(() => Number) @IsInt() @Min(1) @Max(220) bpm: number;
}

export class HeartBeatResponseDTO {
  bpm: number;
  updatedAt: Date;
}
