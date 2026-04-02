import { Injectable } from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceIdResponseDTO } from '../dto/device-id-response.dto';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { ElderProfileResponse } from '../dto/elder-profile.dto';
import { ICaregiverRepository } from './interfaces/caregiver.repository.interface';

@Injectable()
export class PrismaCaregiverRepository implements ICaregiverRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createElderLink(
    payload: JwtPayloadDTO,
    deviceIdDto: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO | null> {
    const caregiverId = payload.userId;
    const { deviceId } = deviceIdDto;

    const user = await this.prisma.$transaction(async (prisma) => {
      if (
        !(await prisma.elderProfile.findUnique({
          where: { deviceId },
        }))
      ) {
        return null;
      }

      const hasCaregiver = await prisma.elderProfile.findFirst({
        where: { deviceId, caregiverId: { not: null } },
        select: { caregiverId: true },
      });

      if (hasCaregiver) {
        return {
          conflict: true,
        } as const;
      }

      await prisma.elderProfile.updateMany({
        where: { deviceId, caregiverId: null },
        data: { caregiverId },
      });

      return await prisma.caregiverProfile.findUnique({
        where: {
          userId: caregiverId,
        },
        include: {
          elder: true,
        },
      });
    });

    if (!user) return null;
    if ('conflict' in user) return user as never;
    if (!user.elder?.deviceId) return null;

    return { deviceId: user.elder.deviceId };
  }

  async deleteElderLink(payload: JwtPayloadDTO): Promise<void> {
    await this.prisma.caregiverProfile.update({
      where: { userId: payload.userId },
      data: { elder: { disconnect: true } },
    });
  }

  async getElderLinked(payload: JwtPayloadDTO): Promise<ElderProfileResponse> {
    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { userId: payload.userId },
      include: { elder: true },
    });

    if (!caregiver?.elder?.userId) {
      return {
        name: null,
        phone: null,
        deviceId: null,
        bpm: null,
      } as never;
    }

    const elder = await this.prisma.user.findUnique({
      where: { id: caregiver.elder.userId },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    return {
      name: elder?.name as string,
      phone: elder?.phone as string,
      deviceId: elder?.elderProfile?.deviceId as string,
      bpm: elder?.elderProfile?.bpm as number | null,
    };
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO | null> {
    const deviceId = (
      await this.prisma.caregiverProfile.findUnique({
        where: { userId: payload.userId },
        include: { elder: true },
      })
    )?.elder?.deviceId;

    if (!deviceId) return null;

    return { deviceId };
  }
}
