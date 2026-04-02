import { ApiProperty } from '@nestjs/swagger';

class ElderProfile {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 15 })
  caregiverId: number | null;

  @ApiProperty({ example: 72 })
  bpm: number | null;

  @ApiProperty({ example: '24Wwsc24' })
  deviceId: string | null;

  @ApiProperty({ example: '2025-09-08T17:25:18.805Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-08T17:25:18.805Z' })
  updatedAt: Date;
}

class CaregiverProfile {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: '2025-09-08T17:25:18.805Z' })
  createdAt: Date;
}

export class UserEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '41579506070' })
  cpf: string;

  @ApiProperty({ example: 'johndoe123@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '011980028922' })
  phone: string;

  @ApiProperty({ example: 'elder' })
  role: 'admin' | 'elder' | 'caregiver';

  @ApiProperty({ example: '2025-09-08T17:25:18.802Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-08T17:25:18.802Z' })
  updatedAt: Date;

  @ApiProperty({ type: ElderProfile })
  elderProfile?: ElderProfile | null;

  @ApiProperty({
    type: CaregiverProfile,
    nullable: true,
    description: 'Caregiver data or null when the elder not have a caregiver',
    example: CaregiverProfile,
  })
  caregiverProfile?: CaregiverProfile | null;
}
