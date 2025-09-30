import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo Push Token',
  })
  expoPushToken: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    enum: ['android', 'ios'],
    example: 'android',
  })
  platform: 'android' | 'ios';

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: '15',
  })
  osVersion: string;
}
