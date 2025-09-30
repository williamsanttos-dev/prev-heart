import {
  BadRequestException,
  ConflictException,
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
import { LoginUserResponseDTO } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    const { email, cpf, password, name, phone, role } = createUserDto;

    if (!['elder', 'caregiver', 'admin'].includes(role))
      throw new BadRequestException('invalid role');

    const passwordHash: string = await bcrypt.hash(password, 10);

    await this.prisma.$transaction(async (prisma) => {
      if (
        await prisma.user.findFirst({
          where: { email },
          select: { email: true },
        })
      )
        throw new ConflictException();

      const u = await prisma.user.create({
        data: {
          email,
          cpf,
          passwordHash: passwordHash,
          name,
          phone,
          role,
        },
      });
      if (role === 'elder')
        await prisma.elderProfile.create({ data: { userId: u.id } });
      else if (role === 'caregiver')
        await prisma.caregiverProfile.create({ data: { userId: u.id } });

      return;
    });

    return;
  }

  async login(loginUserDTO: LoginUserDTO): Promise<LoginUserResponseDTO> {
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

    return { accessToken, role: result.role, id: result.id, name: result.name };
  }
}
