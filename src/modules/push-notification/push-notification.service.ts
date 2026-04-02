import { Inject, Injectable } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import type { IPushNotificationRepository } from './interfaces/push-notification.repository.interface';
import type { IPushNotificationService } from './interfaces/push-notification.service.interface';

type MessageExpo = {
  to: string;
  sound: string;
  title: string;
  body: string;
};

@Injectable()
export class PushNotificationService implements IPushNotificationService {
  constructor(
    @Inject('PushNotificationRepository')
    private readonly pushNotificationRepository: IPushNotificationRepository,
    private readonly expo: Expo,
  ) {}

  async create(
    payloadJwt: JwtPayloadDTO,
    createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void> {
    await this.pushNotificationRepository.create(
      payloadJwt,
      createPushNotificationDto,
    );
  }

  async send(caregiverId: number, name: string, bpm: number): Promise<void> {
    const TIME_GAP_IN_SECONDS = 30;
    const TITLE = 'Atenção!';
    const MESSAGE = `BPM elevado detectado para ${name}: ${bpm}`;

    const expoToken = await this.pushNotificationRepository.reserveTokenForSend(
      caregiverId,
      new Date(),
      TIME_GAP_IN_SECONDS,
    );

    if (!expoToken) return;

    const message: MessageExpo = {
      to: expoToken,
      sound: 'default',
      title: TITLE,
      body: MESSAGE,
    };

    await this.expo.sendPushNotificationsAsync([message]);
  }

  async remove(payloadJwt: JwtPayloadDTO): Promise<void> {
    await this.pushNotificationRepository.remove(payloadJwt);
  }
}
