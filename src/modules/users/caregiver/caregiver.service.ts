import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceIdResponseDTO } from '../dto/device-id-response.dto';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { ElderProfileResponse } from '../dto/elder-profile.dto';

@Injectable()
export class CaregiverService {
  constructor(private readonly prisma: PrismaService) {}

  async createElderLink(
    payload: JwtPayloadDTO,
    deviceIdDto: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO> {
    const caregiverId = payload.userId;
    const { deviceId } = deviceIdDto;

    const user = await this.prisma.$transaction(async (prisma) => {
      if (
        !(await prisma.elderProfile.findUnique({
          where: { deviceId },
        }))
      ) {
        throw new NotFoundException('The device has not yet been registered.');
      }

      if (
        await prisma.elderProfile.findFirst({
          where: { deviceId, caregiverId: { not: null } },
          select: { caregiverId: true },
        })
      ) {
        throw new ConflictException(
          'The elderly person linked to the device already has a caregiver. First, you need to unlink the device from the elderly person in order to link another one.',
        );
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

    if (!user?.elder?.deviceId) throw new InternalServerErrorException();

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
      throw new NotFoundException({
        message: 'The caregiver does not have a elder assigned to them.',
        body: {
          name: null,
          phone: null,
          deviceId: null,
          bpm: null,
        },
      });
    }

    const elder = await this.prisma.user.findUnique({
      where: { id: caregiver.elder.userId },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    if (
      !elder?.name ||
      !elder?.phone ||
      !elder?.elderProfile?.deviceId ||
      !elder?.elderProfile?.bpm
    ) {
      throw new InternalServerErrorException();
    }

    return {
      name: elder.name,
      phone: elder.phone,
      deviceId: elder.elderProfile.deviceId,
      bpm: elder.elderProfile.bpm,
    };
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO> {
    const deviceId = (
      await this.prisma.caregiverProfile.findUnique({
        where: { userId: payload.userId },
        include: { elder: true },
      })
    )?.elder?.deviceId;

    if (!deviceId) throw new NotFoundException();

    return { deviceId };
  }
}
