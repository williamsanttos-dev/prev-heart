import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from 'src/shared/mappers/user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userMapper: UserMapper,
  ) {}

  create(_createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
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
}
