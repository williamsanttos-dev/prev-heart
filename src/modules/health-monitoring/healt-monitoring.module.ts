import { Module } from '@nestjs/common';
import Expo from 'expo-server-sdk';

import {
  HEART_RATE_PROVIDER,
  HEART_RATE_REPOSITORY,
  ALERT_NOTIFIER,
  PUSH_TOKEN_REPOSITORY,
  EXPO_PUSH_CLIENT,
  PROCESS_HEART_RATE_ALERT_SERVICE,
} from './health-monitoring.tokens';

import { MockHeartRateProvider } from './providers/mock-heart-rate.provider';
import { PrismaHeartRateRepository } from './repositories/prisma-heart-rate.repository';
import { PrismaPushNotificationRepository } from '../push-notification/push-notification.repository';
import { ExpoAlertNotifier } from './notifications/expo-alert.notifier';
import { ProcessHeartRateAlertService } from './services/process-heart-rate-alert.service';

@Module({
  providers: [
    {
      provide: HEART_RATE_PROVIDER,
      useClass: MockHeartRateProvider,
    },
    {
      provide: HEART_RATE_REPOSITORY,
      useClass: PrismaHeartRateRepository,
    },
    {
      provide: PUSH_TOKEN_REPOSITORY,
      useClass: PrismaPushNotificationRepository,
    },
    {
      provide: EXPO_PUSH_CLIENT,
      useClass: Expo,
    },

    {
      provide: ALERT_NOTIFIER,
      useClass: ExpoAlertNotifier,
    },
    {
      provide: PROCESS_HEART_RATE_ALERT_SERVICE,
      useClass: ProcessHeartRateAlertService,
    },
  ],
  exports: [
    HEART_RATE_PROVIDER,
    HEART_RATE_REPOSITORY,
    ALERT_NOTIFIER,
    PROCESS_HEART_RATE_ALERT_SERVICE,
  ],
})
export class HealthMonitoringModule {}
