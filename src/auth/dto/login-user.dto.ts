import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDTO {
  @ApiProperty({
    example: '41579506070',
  })
  @IsString()
  @Length(11, 11)
  cpf: string;

  @ApiProperty({
    example: 'John2Doe62',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain uppercase letters, lowercase letters, numbers and at least 8 characters',
  })
  password: string;
}
