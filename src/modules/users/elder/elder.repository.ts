import { Injectable } from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaregiverProfileResponse } from './dto/caregiver-profile.dto';
import { DeviceIdResponseDTO } from '../user/dto/device-id-response.dto';
import { DeviceIdDTO } from '../user/dto/device-id.dto';
import { IElderRepository } from './interfaces/elder.repository.interface';

@Injectable()
export class PrismaElderRepository implements IElderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.elderProfile.findMany({
      select: {
        deviceId: true,
        userId: true,
      },
    });
  }

  // não vai mais existir
  // async sendBPM(
  //   payload: JwtPayloadDTO,
  //   heartBeatDto: HeartBeatDTO,
  // ): Promise<ElderBpmResult | null> {
  //   const elder = await this.prisma.elderProfile.update({
  //     where: { userId: payload.userId },
  //     data: { bpm: heartBeatDto.bpm },
  //     include: {
  //       user: true,
  //     },
  //   });

  //   if (!elder.bpm || !elder.user.name) return null;

  //   return {
  //     bpm: elder.bpm,
  //     updatedAt: elder.updatedAt,
  //     caregiverId: elder.caregiverId,
  //     elderName: elder.user.name,
  //   };
  // }

  async registerDevice(
    payload: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO | null> {
    const user = await this.prisma.elderProfile.update({
      where: { userId: payload.userId },
      data: { deviceId: deviceId.deviceId },
    });

    if (!user.deviceId) return null;

    return { deviceId: user.deviceId };
  }

  async getCaregiverLinked(
    payload: JwtPayloadDTO,
  ): Promise<CaregiverProfileResponse | null> {
    const caregiverId = (
      await this.prisma.elderProfile.findUnique({
        where: { userId: payload.userId },
        select: { caregiverId: true },
      })
    )?.caregiverId;

    if (!caregiverId) return null;

    const caregiver = await this.prisma.user.findUnique({
      where: { id: caregiverId },
      select: {
        name: true,
        phone: true,
      },
    });

    if (!caregiver?.name || !caregiver?.phone) return null;

    return { name: caregiver.name, phone: caregiver.phone };
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO | null> {
    const deviceId = (
      await this.prisma.elderProfile.findUnique({
        where: { userId: payload.userId },
        select: { deviceId: true },
      })
    )?.deviceId;

    if (!deviceId) return null;

    return { deviceId };
  }

  async deleteDevice(payload: JwtPayloadDTO): Promise<void> {
    await this.prisma.elderProfile.update({
      where: { userId: payload.userId },
      data: {
        deviceId: null,
        bpm: null,
        caregiverId: null,
      },
    });
  }
}
