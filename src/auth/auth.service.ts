import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import bcrypt from 'bcrypt';
import { LoginUserDTO } from './dto/login-user.dto';

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

  login(loginUserDTO: LoginUserDTO) {
    const { cpf, password } = loginUserDTO;
  }

  findAll() {
    return `This action returns all users`;
  }
}
