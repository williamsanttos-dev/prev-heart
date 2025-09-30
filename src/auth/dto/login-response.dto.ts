import { ApiProperty } from '@nestjs/swagger';

export class LoginUserResponseDTO {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    type: 'string',
    enum: ['admin', 'elder', 'caregiver'],
    example: 'elder',
  })
  role: 'admin' | 'elder' | 'caregiver';

  @ApiProperty({
    example: 1,
  })
  id: number;

  @ApiProperty({
    example: 'John doe',
  })
  name: string;
}
