import { ApiProperty } from '@nestjs/swagger';
import { DeviceIdResponseDTO } from '../../user/dto/device-id-response.dto';

export class ElderProfileResponse extends DeviceIdResponseDTO {
  @ApiProperty({
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    example: '011980028922',
  })
  phone: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 72,
    description: 'It can be a number or null',
  })
  bpm: number | null;
}
