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

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
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
        birthDate: updateUserDto.birthDate,
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
    heartBeatDtoDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    const { userId } = payloadJwt;

    const elder = await this.prisma.elderProfile.update({
      where: { userId },
      data: { bpm: heartBeatDtoDto.bpm },
    });

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
    return user;
  }

  async getElderLinked(payloadJwt: JwtPayloadDTO): Promise<UserEntity> {
    const { userId } = payloadJwt;

    const caregiver = await this.prisma.caregiverProfile.findUnique({
      where: { userId },
      include: { elder: true },
    });

    if (!caregiver?.elder?.userId)
      throw new NotFoundException(
        'The caregiver does not have a elder assigned to them.',
      );

    const elder = await this.prisma.user.findUnique({
      where: { id: caregiver.elder.userId },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    return this.userMapper.toEntityFromPrisma(elder!);
  }

  async getCaregiverLinked(payloadJwt: JwtPayloadDTO) {
    const { userId } = payloadJwt;

    const caregiverId = await this.prisma.elderProfile.findUnique({
      where: { userId },
      select: { caregiverId: true },
    });
    if (!caregiverId?.caregiverId)
      throw new NotFoundException(
        'The elderly person does not have a caregiver assigned to them.',
      );

    const caregiver = await this.prisma.user.findUnique({
      where: { id: caregiverId.caregiverId },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    return this.userMapper.toEntityFromPrisma(caregiver!);
  }
}
