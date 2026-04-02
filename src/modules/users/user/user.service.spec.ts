jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const date = new Date('2025-09-08T17:25:18.802Z');
  const payload: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };
  const userEntity: UserEntity = {
    id: 1,
    cpf: '41579506070',
    email: 'johndoe123@example.com',
    name: 'John Doe',
    phone: '011980028922',
    role: 'elder',
    createdAt: date,
    updatedAt: date,
    elderProfile: {
      userId: 1,
      caregiverId: 15,
      bpm: 72,
      deviceId: '24Wwsc24',
      createdAt: date,
      updatedAt: date,
    },
    caregiverProfile: {
      userId: 1,
      createdAt: date,
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        UserMapper,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(UserService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('getProfile', () => {
    it('returns the user profile returned by prisma', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(userEntity);

      await expect(service.getProfile(payload)).resolves.toEqual(userEntity);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.user.findUnique.mockRejectedValueOnce(prismaError);

      await expect(service.getProfile(payload)).rejects.toBe(prismaError);
    });

    it('throws when prisma returns null', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getProfile(payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'newJohnDoe',
      phone: '011980028944',
    };

    it('returns the updated user returned by prisma', async () => {
      prisma.user.update.mockResolvedValueOnce({
        ...userEntity,
        ...updateUserDto,
      });

      await expect(service.update(payload, updateUserDto)).resolves.toEqual({
        ...userEntity,
        ...updateUserDto,
      });
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.user.update.mockRejectedValueOnce(prismaError);

      await expect(service.update(payload, updateUserDto)).rejects.toBe(
        prismaError,
      );
    });
  });

  describe('remove', () => {
    it('deletes the current user', async () => {
      prisma.user.deleteMany.mockResolvedValueOnce({ count: 1 });

      await expect(service.remove(payload)).resolves.toBeUndefined();
      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: { id: payload.userId },
      });
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.user.deleteMany.mockRejectedValueOnce(prismaError);

      await expect(service.remove(payload)).rejects.toBe(prismaError);
    });
  });
});
