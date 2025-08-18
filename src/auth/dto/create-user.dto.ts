import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString() @Length(11, 11) cpf: string;
  @IsEmail() email: string;
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain uppercase letters, lowercase letters, numbers and at least 8 characters',
  })
  password: string;
  @IsString() @Length(3, 100) name: string;
  @IsString() @Length(10, 15) phone: string;
  @Type(() => Date) @IsDate() birthDate: Date;
  @IsString() role: 'admin' | 'elder' | 'caregiver';
}
