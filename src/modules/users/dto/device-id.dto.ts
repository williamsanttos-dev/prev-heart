import { Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceIdDTO {
  @ApiProperty({
    example: 'gHD58yg7',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8}$/, {
    message:
      'The device ID must be valid. It must contain only letters and numbers, and the length must be 8. ',
  })
  deviceId: string;
}
