import { Module } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

import { PushTokenService } from './push-token.service';
import { PushTokenController } from './push-token.controller';

@Module({
  controllers: [PushTokenController],
  providers: [
    PushTokenService,
    {
      provide: Expo,
      useFactory: () => new Expo(),
    },
  ],
  exports: [PushTokenService],
})
export class PushTokenModule {}
