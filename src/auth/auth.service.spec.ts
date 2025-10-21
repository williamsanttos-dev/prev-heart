import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserResponseDTO } from './dto/login-response.dto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('AuthService', () => {
  const mockConfigService = {
    get: (key: string) => {
      const map = {
        SECRET_ACCESS_TOKEN: 'test-secret',
        SECRET_REFRESH_TOKEN: 'test-refresh-secret',
      };
      return map[key];
    },
  };
  let service: AuthService;
  let prisma: Partial<PrismaService>;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const mockCreateUserDto = {
      cpf: '41579506070',
      email: 'johndoe123@example.com',
      password: 'John2Doe62',
      name: 'John Doe',
      phone: '011980028922',
      role: 'elder' as const,
    };
    it('must create the user "elder" with successfully and return void (happy path)', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          user: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              email: 'johndoe123@example.com',
              cpf: '41579506070',
              passwordHash:
                'nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa',
              name: 'John Doe',
              phone: '011980028922',
              role: 'elder',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            findFirst: jest.fn().mockResolvedValue(null),
          },
          elderProfile: {
            create: jest.fn().mockResolvedValueOnce({
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: 1,
              caregiverId: null,
              deviceId: null,
              bpm: null,
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.register(mockCreateUserDto);

      expect(result).toBeUndefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
    it('throws a BadRequestException when the role is not "admin", "elder", or "caregiver"', async () => {
      const mockCreateUserDtoWithInvalidRole = {
        ...mockCreateUserDto,
        role: 'invalid' as const,
      };

      await expect(
        // @ts-expect-error TS2345: passing string to test for runtime error
        service.register(mockCreateUserDtoWithInvalidRole),
      ).rejects.toThrow(BadRequestException);
    });
    it('throws a ConflictException when the user enters an email address that already exists in the database', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          user: {
            findFirst: jest.fn().mockResolvedValue(mockCreateUserDto.email),
          },
        };
        return callback(tx);
      });

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
    it('throws a ConflictException when the user enters an CPF that already exists in the database', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        const tx = {
          user: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValue(mockCreateUserDto.cpf),
          },
        };
        return callback(tx);
      });

      await expect(service.register(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  describe('login', () => {
    it('throws a NotFoundException when the user enters a CPF that is not yet registered', async () => {
      (prisma.user?.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ cpf: '12345678912', password: 'johnDoe123' }),
      ).rejects.toThrow(NotFoundException);
    });
    it('throws a UnauthorizedException when the user enter a wrong password', async () => {
      (prisma.user?.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({ cpf: '12345678911', password: 'passwordWrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('should return the LoginUserResponseDTO when the user enters the correctly credentials (happy path)', async () => {
      const mockLoginUserResponseDTO: LoginUserResponseDTO = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        role: 'elder',
        id: 1,
        name: 'John doe',
      };

      (prisma.user?.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: 'hash',
        id: mockLoginUserResponseDTO.id,
        role: mockLoginUserResponseDTO.role,
        name: mockLoginUserResponseDTO.name,
      });
      (bcrypt.compare as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      );

      const result = await service.login({
        cpf: '12345678911',
        password: 'johnDoe123',
      });

      expect(result).toEqual(mockLoginUserResponseDTO);
      expect(bcrypt.compare).toHaveBeenCalledWith('johnDoe123', 'hash');
      expect(jwt.sign).toHaveBeenCalled();
    });
  });
});
