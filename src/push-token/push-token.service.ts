import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
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
  constructor(private readonly prisma: PrismaService) {}
  private readonly expo = new Expo();

  async create(
    payloadJwt: JwtPayloadDTO,
    createPushTokenDto: CreatePushTokenDto,
  ): Promise<void> {
    const { expoPushToken, platform, osVersion } = createPushTokenDto;
    const [lastActiveAt, lastSeenAt] = [new Date(), new Date()];

    console.log(createPushTokenDto);

    await this.prisma.pushToken.upsert({
      where: { expoTokenPush: expoPushToken },
      create: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform: platform,
        osVersion: osVersion,
        lastActiveAt: lastActiveAt,
        lastSentAt: lastSeenAt,
      },
      update: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform: platform,
        osVersion: osVersion,
        lastActiveAt: lastActiveAt,
        lastSentAt: lastSeenAt,
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

      // caregiver must be exist.
      if (!result) throw new InternalServerErrorException();

      const now = new Date().getTime();
      const lastSent = result.lastSentAt?.getTime();
      const diffSec = (now - lastSent!) / 1000;

      // Notifications will only be sent at intervals of more than 30 seconds after the last notification was sent
      if (diffSec < TIME_GAP) return null;

      await prisma.pushToken.update({
        where: { expoTokenPush: result.expoTokenPush },
        data: {
          lastSentAt: new Date(),
        },
      });

      return result.expoTokenPush;
    });

    if (expoToken === null) return;

    const message: MessageExpo = {
      to: expoToken,
      sound: 'default',
      title: TITLE,
      body: MESSAGE,
    };

    const tickets = await this.expo.sendPushNotificationsAsync([message]);
    console.log(tickets);
  }

  findAll() {
    return `This action returns all pushToken`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pushToken`;
  }

  update(id: number, _updatePushTokenDto: UpdatePushTokenDto) {
    return `This action updates a #${id} pushToken`;
  }

  async remove(payloadJwt: JwtPayloadDTO): Promise<void> {
    await this.prisma.pushToken.delete({
      where: { userId: payloadJwt.userId },
    });
  }
}
