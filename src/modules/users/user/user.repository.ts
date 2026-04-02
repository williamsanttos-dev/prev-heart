import { Injectable } from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { IUserRepository } from './interfaces/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
  ) {}

  async getProfile(payload: JwtPayloadDTO): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        elderProfile: true,
        caregiverProfile: true,
      },
    });

    if (!user) return null;

    return this.userMapper.toEntityFromPrisma(user);
  }

  async update(
    payload: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: payload.userId },
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

  async remove(payload: JwtPayloadDTO): Promise<void> {
    await this.prisma.user.deleteMany({
      where: { id: payload.userId },
    });
  }
}
