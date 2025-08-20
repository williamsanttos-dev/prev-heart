import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';

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
}
