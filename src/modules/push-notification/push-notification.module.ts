import { Module } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';

@Module({
  controllers: [PushNotificationController],
  providers: [
    PushNotificationService,
    {
      provide: Expo,
      useFactory: () => new Expo(),
    },
  ],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
