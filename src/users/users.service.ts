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

    // if (role === 'elder') {
    //   const user = await this.prisma.user.findUniqueOrThrow({
    //     where: { id },
    //     include: {
    //       elderProfile: true,
    //     },
    //   });

    //   const { passwordHash: _passwordHash, ...profile } = user;
    //   return profile;
    // } else if (role === 'caregiver') {
    //   const user = await this.prisma.user.findUniqueOrThrow({
    //     where: { id },
    //     include: {
    //       caregiverProfile: true,
    //     },
    //   });
    //   const { passwordHash: _passwordHash, ...profile } = user;
    //   return profile;
    // } else {
    //   const user = await this.prisma.user.findUniqueOrThrow({
    //     where: { id },
    //   });
    //   const { passwordHash: _passwordHash, ...profile } = user;
    //   return profile;
    // }
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
