import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserService {
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

    if (!user) throw new InternalServerErrorException();

    return this.userMapper.toEntityFromPrisma(user);
  }

  async update(
    payload: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const { userId: id } = payload;

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

  async remove(payload: JwtPayloadDTO): Promise<void> {
    const { userId: id } = payload;

    await this.prisma.user.deleteMany({
      where: { id },
    });
  }
}
