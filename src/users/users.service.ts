import {
  ConflictException,
  Injectable,
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

    // if the user is authenticated, it exists.
    return this.userMapper.toEntityFromPrisma(user!);
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

    await this.prisma.user.delete({
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

    if (heartBeatDto.bpm > LIMIT && elder.caregiverId)
      await this.pushToken.send(elder.caregiverId, elder.user.name, elder.bpm!);

    return { bpm: elder.bpm!, updatedAt: elder.updatedAt };
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

    // the string has already been validated.
    return { deviceId: user.deviceId! };
  }

  async createElderLink(payloadJwt: JwtPayloadDTO, deviceIdDto: DeviceIdDTO) {
    const { userId: caregiverId } = payloadJwt;
    const { deviceId } = deviceIdDto;

    const user = await this.prisma.$transaction(async (prisma) => {
      if (
        !(await this.prisma.elderProfile.findUnique({
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
    // if the link was created, the elder has a device.
    return { deviceId: user!.elder!.deviceId };
  }

  async deleteElderLink(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    await this.prisma.caregiverProfile.update({
      where: { userId },
      data: { elder: { disconnect: true } },
    });
  }

  async getElderLinked(payloadJwt: JwtPayloadDTO) {
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

    // if elder is linked, name, phone, deviceId and bpm exists.
    return {
      name: elder!.name,
      phone: elder!.phone,
      deviceId: elder!.elderProfile!.deviceId,
      bpm: elder!.elderProfile!.bpm,
    };
  }

  async getCaregiverLinked(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    const caregiverId = await this.prisma.elderProfile.findUnique({
      where: { userId },
      select: { caregiverId: true },
    });
    if (caregiverId?.caregiverId === null)
      return {
        name: null,
        phone: null,
      };
    // throw new NotFoundException(
    //   'The elderly person does not have a caregiver assigned to them.',
    // );

    const caregiver = await this.prisma.user.findUnique({
      where: { id: caregiverId!.caregiverId },
      select: {
        name: true,
        phone: true,
      },
    });

    return { name: caregiver!.name, phone: caregiver!.phone };
  }

  async getDevice(payloadJwt: JwtPayloadDTO) {
    const { userId, role } = payloadJwt;

    // userId belongs to the Elder
    if (role === 'elder') {
      const result = await this.prisma.elderProfile.findUnique({
        where: { userId },
        select: { deviceId: true },
      });

      return { deviceId: result?.deviceId };
    }
    // userId belongs to the Caregiver
    else if (role === 'caregiver') {
      const result = await this.prisma.caregiverProfile.findUnique({
        where: { userId },
        include: { elder: true },
      });

      const deviceId = result?.elder?.deviceId;
      console.log(deviceId);
      return { deviceId: deviceId === undefined ? null : deviceId };
    }
  }

  async deleteDevice(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    // esse valor tem que sumir do cuidador também
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
