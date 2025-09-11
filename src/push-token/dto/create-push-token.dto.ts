import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  expoPushToken: string;

  @IsNotEmpty()
  @IsString()
  platform: 'android' | 'ios';

  @IsNotEmpty()
  @IsString()
  osVersion: string;
}
