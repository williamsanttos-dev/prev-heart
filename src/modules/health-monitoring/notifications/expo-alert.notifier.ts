import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AlertNotifier,
  NotifyHighHeartRateInput,
} from '../interfaces/alert-notifier.interface';
import {
  PushTokenRecord,
  type IPushNotificationRepository,
} from 'src/modules/push-notification/interfaces/push-notification.repository.interface';
import {
  SendPushMessageExpoInput,
  type ExpoPushClient,
} from '../notifications/expo-push-client.interface';
import {
  PUSH_TOKEN_REPOSITORY,
  EXPO_PUSH_CLIENT,
} from '../health-monitoring.tokens';

@Injectable()
export class ExpoAlertNotifier implements AlertNotifier {
  private readonly logger = new Logger(ExpoAlertNotifier.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepository: IPushNotificationRepository,

    @Inject(EXPO_PUSH_CLIENT)
    private readonly expoPushClient: ExpoPushClient,
  ) {}

  async notifyHighHeartRate(input: NotifyHighHeartRateInput): Promise<void> {
    const expoToken = await this.pushTokenRepository.findByUserId(
      input.caregiverId,
    );

    if (!expoToken) {
      this.logger.warn(
        `No push tokens found for caregiver of elder ${input.elderId}`,
      );
      return;
    }

    const message = this.buildMessage(expoToken, input);

    await this.expoPushClient.send(message);

    this.logger.warn(
      `A high heart rate alert has been sent for the elderly person ${input.elderId} to the caregiver's device ${input.caregiverId}`,
    );
  }

  private buildMessage(
    token: PushTokenRecord,
    input: NotifyHighHeartRateInput,
  ): SendPushMessageExpoInput {
    return {
      to: token.token,
      sound: 'default',
      title: 'Atenção!',
      body: `O batimento cardíaco de ${input.elderName} alcançou ${input.bpm} `,
    };
  }

  //   private waitGapForSendAnotherMessage(
  //     token: PushTokenRecord,
  //     input: NotifyHighHeartRateInput,
  //   ): Promise<boolean> {
  //     const TIME_GAP_IN_SECONDS: 30;
  //   }
}
