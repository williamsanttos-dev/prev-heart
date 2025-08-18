import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserDTO } from './dto/login-user.dto';
import env from '../config/env.config';
import { JwtPayloadDTO } from './dto/Jwt-payload';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    const { email, cpf, password, name, phone, birthDate, role } =
      createUserDto;

    if (!['elder', 'caregiver', 'admin'].includes(role))
      throw new BadRequestException('invalid role');

    const passwordHash: string = await bcrypt.hash(password, 10);

    const user = await this.prisma.$transaction(async (prisma) => {
      const u = await prisma.user.create({
        data: {
          email,
          cpf,
          passwordHash: passwordHash,
          name,
          phone,
          birthDate,
          role,
        },
      });
      if (role === 'elder')
        await prisma.elderProfile.create({ data: { userId: u.id } });
      else if (role === 'caregiver')
        await prisma.caregiverProfile.create({ data: { userId: u.id } });

      return u;
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async login(loginUserDTO: LoginUserDTO) {
    const { cpf, password } = loginUserDTO;

    const result = await this.prisma.user.findUnique({
      where: { cpf },
    });
    if (!result?.passwordHash) throw new NotFoundException('User not found');

    const passwordMatch = await bcrypt.compare(password, result.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException();

    const accessToken = jwt.sign(
      { userId: result.id, role: result.role },
      env.SECRET_ACCESS_TOKEN,
      { expiresIn: '24h' },
    );

    return { accessToken };
  }

  async getProfile(payload: JwtPayloadDTO) {
    const { role, userId: id } = payload;

    if (role === 'elder') {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
        include: {
          elderProfile: true,
        },
      });

      const { passwordHash: _passwordHash, ...profile } = user;
      return profile;
    } else if (role === 'caregiver') {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
        include: {
          caregiverProfile: true,
        },
      });
      const { passwordHash: _passwordHash, ...profile } = user;
      return profile;
    } else {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
      });
      const { passwordHash: _passwordHash, ...profile } = user;
      return profile;
    }
  }
}
