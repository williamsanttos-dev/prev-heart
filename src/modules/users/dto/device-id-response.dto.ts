import { ApiProperty } from '@nestjs/swagger';

export class DeviceIdResponseDTO {
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'gHD58yg7',
    description: 'It can be a string or null',
  })
  deviceId: string | null;
}
