import { ApiProperty } from '@nestjs/swagger';

export class CaregiverProfileResponse {
  @ApiProperty({
    example: 'John Smith',
  })
  name: string;

  @ApiProperty({
    example: '083980028922',
  })
  phone: string;
}
