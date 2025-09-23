import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Length(11, 11)
  cpf: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain uppercase letters, lowercase letters, numbers and at least 8 characters',
  })
  password: string;

  @ApiProperty()
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty()
  @IsString()
  @Length(10, 15)
  phone: string;

  @ApiProperty()
  @IsString()
  role: 'admin' | 'elder' | 'caregiver';
}
