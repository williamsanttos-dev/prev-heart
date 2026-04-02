import { Injectable } from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { IPushNotificationRepository } from './interfaces/push-notification.repository.interface';

@Injectable()
export class PrismaPushNotificationRepository
  implements IPushNotificationRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    payloadJwt: JwtPayloadDTO,
    createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void> {
    const { expoPushToken, platform, osVersion } = createPushNotificationDto;
    const lastActiveAt = new Date();

    await this.prisma.pushToken.upsert({
      where: { expoTokenPush: expoPushToken },
      create: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform,
        osVersion,
        lastActiveAt,
        lastSentAt: null,
      },
      update: {
        userId: payloadJwt.userId,
        expoTokenPush: expoPushToken,
        platform,
        osVersion,
        lastActiveAt,
        lastSentAt: null,
      },
    });
  }

  async reserveTokenForSend(
    caregiverId: number,
    now: Date,
    timeGapInSeconds: number,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (prisma) => {
      const result = await prisma.pushToken.findUnique({
        where: { userId: caregiverId },
        select: { expoTokenPush: true, lastSentAt: true },
      });

      if (!result?.expoTokenPush) return null;

      if (
        result.lastSentAt &&
        (now.getTime() - result.lastSentAt.getTime()) / 1000 <= timeGapInSeconds
      ) {
        return null;
      }

      await prisma.pushToken.update({
        where: { expoTokenPush: result.expoTokenPush },
        data: {
          lastSentAt: now,
        },
      });

      return result.expoTokenPush;
    });
  }

  async remove(payloadJwt: JwtPayloadDTO): Promise<void> {
    await this.prisma.pushToken.delete({
      where: { userId: payloadJwt.userId },
    });
  }
}
