import { Injectable } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';

type MessageExpo = {
  to: string;
  sound: string;
  title: string;
  body: string;
};

@Injectable()
export class PushTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expo: Expo,
  ) {}

  async create(
    payloadJwt: JwtPayloadDTO,
    createPushTokenDto: CreatePushTokenDto,
  ): Promise<void> {
    const { expoPushToken, platform, osVersion } = createPushTokenDto;
    const lastActiveAt = new Date();

    await this.prisma.pushToken.upsert({
      where: { expoTokenPush: expoPushToken },
      create: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform: platform,
        osVersion: osVersion,
        lastActiveAt: lastActiveAt,
        lastSentAt: null,
      },
      update: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform: platform,
        osVersion: osVersion,
        lastActiveAt: lastActiveAt,
        lastSentAt: null,
      },
    });
  }

  async send(caregiverId: number, name: string, bpm: number): Promise<void> {
    const TIME_GAP = 30;
    const TITLE = 'Atenção!';
    const MESSAGE = `BPM elevado detectado para ${name}: ${bpm}`;

    const expoToken = await this.prisma.$transaction(async (prisma) => {
      const result = await prisma.pushToken.findUnique({
        where: { userId: caregiverId },
        select: { expoTokenPush: true, lastSentAt: true },
      });

      if (!result?.expoTokenPush) return null;

      // Notifications will only be sent at intervals of more than 30 seconds after the last notification was sent
      // result.lastSentAt is null when is created.
      if (result?.lastSentAt)
        if ((Date.now() - result.lastSentAt.getTime()) / 1000 <= TIME_GAP)
          return null;

      await prisma.pushToken.update({
        where: { expoTokenPush: result.expoTokenPush },
        data: {
          lastSentAt: new Date(),
        },
      });

      return result.expoTokenPush;
    });

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
    await this.prisma.pushToken.delete({
      where: { userId: payloadJwt.userId },
    });
  }
}
