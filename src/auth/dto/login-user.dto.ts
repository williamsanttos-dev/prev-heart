import { IsString, Length, Matches } from 'class-validator';

export class LoginUserDTO {
  @IsString() @Length(11, 11) cpf: string;
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'password must contain uppercase letters, lowercase letters, numbers and at least 8 characters',
  })
  password: string;
}
