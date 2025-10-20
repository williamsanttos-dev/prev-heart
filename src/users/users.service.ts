import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';
import { DeviceIdDTO } from './dto/device-id.dto';
import { PushTokenService } from 'src/push-token/push-token.service';
import { DeviceIdResponseDTO } from './dto/device-id-response.dto';
import { ElderProfileResponse } from './dto/elder-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
    private readonly pushToken: PushTokenService,
  ) {}

  async getProfile(payload: JwtPayloadDTO): Promise<UserEntity> {
    const { userId: id } = payload;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    if (!user) throw new InternalServerErrorException();

    return this.userMapper.toEntityFromPrisma(user);
  }

  async update(
    payloadJwt: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const { userId: id } = payloadJwt;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: updateUserDto.name,
        phone: updateUserDto.phone,
      },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });
    return this.userMapper.toEntityFromPrisma(user);
  }

  async remove(payloadJwt: JwtPayloadDTO): Promise<void> {
    const { userId: id } = payloadJwt;
    await this.prisma.user.deleteMany({
      where: { id },
    });
  }

  async sendBPM(
    payloadJwt: JwtPayloadDTO,
    heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    const LIMIT = 120;

    const elder = await this.prisma.elderProfile.update({
      where: { userId: payloadJwt.userId },
      data: { bpm: heartBeatDto.bpm },
      include: {
        user: true,
      },
    });

    if (!elder.bpm) throw new InternalServerErrorException();

    if (heartBeatDto.bpm > LIMIT && elder.caregiverId)
      await this.pushToken.send(elder.caregiverId, elder.user.name, elder.bpm);

    return { bpm: elder.bpm, updatedAt: elder.updatedAt };
  }

  async registerDevice(
    payloadJwt: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO> {
    const { userId } = payloadJwt;

    const user = await this.prisma.elderProfile.update({
      where: { userId },
      data: { deviceId: deviceId.deviceId },
    });

    if (!user.deviceId) throw new InternalServerErrorException();

    return { deviceId: user.deviceId };
  }

  async createElderLink(
    payloadJwt: JwtPayloadDTO,
    deviceIdDto: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO> {
    const { userId: caregiverId } = payloadJwt;
    const { deviceId } = deviceIdDto;

    const user = await this.prisma.$transaction(async (prisma) => {
      if (
        !(await prisma.elderProfile.findUnique({
          where: { deviceId },
        }))
      )
        throw new NotFoundException('The device has not yet been registered.');

      // If a value is returned, it means that there is already a caregiver linked to the elderly person.
      if (
        await prisma.elderProfile.findFirst({
          where: { deviceId, caregiverId: { not: null } },
          select: { caregiverId: true },
        })
      )
        throw new ConflictException(
          'The elderly person linked to the device already has a caregiver. First, you need to unlink the device from the elderly person in order to link another one.',
        );

      await prisma.elderProfile.updateMany({
        where: { deviceId, caregiverId: null },
        data: { caregiverId },
      });

      const u = await prisma.caregiverProfile.findUnique({
        where: {
          userId: caregiverId,
        },
        include: {
          elder: true,
        },
      });

      return u;
    });

    if (!user?.elder?.deviceId) throw new InternalServerErrorException();
    return { deviceId: user.elder.deviceId };
  }

  async deleteElderLink(payloadJwt: JwtPayloadDTO): Promise<void> {
    const { userId } = payloadJwt;

    await this.prisma.caregiverProfile.update({
      where: { userId },
      data: { elder: { disconnect: true } },
    });
  }

  async getElderLinked(
    payloadJwt: JwtPayloadDTO,
  ): Promise<ElderProfileResponse> {
    const { userId } = payloadJwt;

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
      include: { elder: true },
    });

    if (!caregiver?.elder?.userId)
      throw new NotFoundException({
        message: 'The caregiver does not have a elder assigned to them.',
        body: {
          name: null,
          phone: null,
          deviceId: null,
          bpm: null,
        },
      });

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
    )
      throw new InternalServerErrorException();

    return {
      name: elder.name,
      phone: elder.phone,
      deviceId: elder.elderProfile.deviceId,
      bpm: elder.elderProfile.bpm,
    };
  }

  // catch the code 404 in mobile.
  // ************************************
  // REFACTOR THIS REQUEST IN MOBILE APP.
  // ************************************
  async getCaregiverLinked(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    const caregiverId = (
      await this.prisma.elderProfile.findUnique({
        where: { userId },
        select: { caregiverId: true },
      })
    )?.caregiverId;

    if (!caregiverId)
      throw new NotFoundException(
        'The elderly person does not have a caregiver assigned to them.',
      );

    const caregiver = await this.prisma.user.findUnique({
      where: { id: caregiverId },
      select: {
        name: true,
        phone: true,
      },
    });

    // if caregiver exists, this information should also
    if (!caregiver?.name || !caregiver?.phone)
      throw new InternalServerErrorException();

    return { name: caregiver.name, phone: caregiver.phone };
  }

  async getDevice(payloadJwt: JwtPayloadDTO): Promise<DeviceIdResponseDTO> {
    const { userId, role } = payloadJwt;

    if (role !== 'caregiver' && role !== 'elder')
      throw new InternalServerErrorException('Invalid role');

    if (role === 'elder') {
      const deviceId = (
        await this.prisma.elderProfile.findUnique({
          where: { userId },
          select: { deviceId: true },
        })
      )?.deviceId;

      if (!deviceId) throw new NotFoundException();

      return { deviceId };
    } else {
      const deviceId = (
        await this.prisma.caregiverProfile.findUnique({
          where: { userId },
          include: { elder: true },
        })
      )?.elder?.deviceId;

      if (!deviceId) throw new NotFoundException();

      return { deviceId };
    }
  }

  async deleteDevice(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    await this.prisma.elderProfile.update({
      where: { userId },
      data: {
        deviceId: null,
        bpm: null,
        caregiverId: null,
      },
    });
  }
}
