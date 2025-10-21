import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserDTO } from './dto/login-user.dto';
import { LoginUserResponseDTO } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  private readonly secretKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('SECRET_ACCESS_TOKEN')!;
  }

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
        throw new ConflictException('E-mail already registered');

      if (
        await prisma.user.findFirst({
          where: { cpf },
          select: { cpf: true },
        })
      )
        throw new ConflictException('CPF already registered');

      const u = await prisma.user.create({
        data: {
          email,
          cpf,
          passwordHash: passwordHash,
          name,
          phone,
          role,
        },
        select: { id: true },
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
      this.secretKey,
      { expiresIn: '24h' },
    );

    return { accessToken, role: result.role, id: result.id, name: result.name };
  }
}
