import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: '41579506070',
  })
  @IsString()
  @Length(11, 11)
  cpf: string;

  @ApiProperty({
    example: 'johndoe123@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John2Doe62',
  })
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain uppercase letters, lowercase letters, numbers and at least 8 characters',
  })
  password: string;

  @ApiProperty({
    example: 'John Doe',
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    example: '011980028922',
  })
  @IsString()
  @Length(10, 15)
  phone: string;

  @ApiProperty({
    enum: ['elder', 'caregiver', 'admin'],
  })
  @IsString()
  role: 'admin' | 'elder' | 'caregiver';
}
