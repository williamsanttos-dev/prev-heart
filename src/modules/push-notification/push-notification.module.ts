import { Module } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { PrismaModule } from 'src/prisma/prisma.module';

import { PrismaPushNotificationRepository } from './push-notification.repository';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationController } from './push-notification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PushNotificationController],
  providers: [
    { provide: 'PushNotificationService', useClass: PushNotificationService },
    {
      provide: 'PushNotificationRepository',
      useClass: PrismaPushNotificationRepository,
    },
    {
      provide: Expo,
      useFactory: () => new Expo(),
    },
  ],
  exports: ['PushNotificationService'],
})
export class PushNotificationModule {}
