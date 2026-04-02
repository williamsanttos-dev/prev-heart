import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushTokenService } from 'src/push-token/push-token.service';
import { CaregiverProfileResponse } from '../dto/caregiver-profile.dto';
import { DeviceIdResponseDTO } from '../dto/device-id-response.dto';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { HeartBeatDTO, HeartBeatResponseDTO } from '../dto/heart-beat.dto';

@Injectable()
export class ElderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushToken: PushTokenService,
  ) {}

  async sendBPM(
    payload: JwtPayloadDTO,
    heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    const limit = 120;

    const elder = await this.prisma.elderProfile.update({
      where: { userId: payload.userId },
      data: { bpm: heartBeatDto.bpm },
      include: {
        user: true,
      },
    });

    if (!elder.bpm) throw new InternalServerErrorException();

    if (heartBeatDto.bpm > limit && elder.caregiverId) {
      await this.pushToken.send(elder.caregiverId, elder.user.name, elder.bpm);
    }

    return { bpm: elder.bpm, updatedAt: elder.updatedAt };
  }

  async registerDevice(
    payload: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO> {
    const user = await this.prisma.elderProfile.update({
      where: { userId: payload.userId },
      data: { deviceId: deviceId.deviceId },
    });

    if (!user.deviceId) throw new InternalServerErrorException();

    return { deviceId: user.deviceId };
  }

  async getCaregiverLinked(
    payload: JwtPayloadDTO,
  ): Promise<CaregiverProfileResponse> {
    const caregiverId = (
      await this.prisma.elderProfile.findUnique({
        where: { userId: payload.userId },
        select: { caregiverId: true },
      })
    )?.caregiverId;

    if (!caregiverId) {
      throw new NotFoundException(
        'The elderly person does not have a caregiver assigned to them.',
      );
    }

    const caregiver = await this.prisma.user.findUnique({
      where: { id: caregiverId },
      select: {
        name: true,
        phone: true,
      },
    });

    if (!caregiver?.name || !caregiver?.phone) {
      throw new InternalServerErrorException();
    }

    return { name: caregiver.name, phone: caregiver.phone };
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO> {
    const deviceId = (
      await this.prisma.elderProfile.findUnique({
        where: { userId: payload.userId },
        select: { deviceId: true },
      })
    )?.deviceId;

    if (!deviceId) throw new NotFoundException();

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
