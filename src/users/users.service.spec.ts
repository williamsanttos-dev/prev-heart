import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { PushTokenService } from 'src/push-token/push-token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { DeviceIdDTO } from './dto/device-id.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: Partial<PrismaService>;
  let pushToken: Partial<PushTokenService>;

  const mockUserEntity = {
    id: 1,
    cpf: '41579506070',
    email: 'johndoe123@example.com',
    name: 'John Doe',
    phone: '011980028922',
    role: 'elder',
    createdAt: '2025-09-08T17:25:18.802Z',
    updatedAt: '2025-09-08T17:25:18.802Z',
    elderProfile: {
      userId: 1,
      caregiverId: 15,
      bpm: 72,
      deviceId: '24Wwsc24',
      createdAt: '2025-09-08T17:25:18.805Z',
      updatedAt: '2025-09-08T17:25:18.805Z',
    },
    caregiverProfile: {
      userId: 1,
      createdAt: '2025-09-08T17:25:18.805Z',
    },
  };
  const mockPayloadJwt: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      elderProfile: {
        update: jest.fn(),
      },
    } as any;
    pushToken = {
      send: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UserMapper,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PushTokenService,
          useValue: pushToken,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('getProfile', () => {
    it('happy path: returns the user profile returned by prisma', async () => {
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce(
        mockUserEntity,
      );

      const result = await service.getProfile(mockPayloadJwt);

      expect(result).toEqual(mockUserEntity);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.user?.findUnique as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(service.getProfile(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.user?.findUnique as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.getProfile(mockPayloadJwt)).rejects.toBe(
        unknownError,
      );
    });
    it('should throw if prisma returns null value', async () => {
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.getProfile(mockPayloadJwt)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
  describe('update', () => {
    const mockUpdateUserDTO = {
      name: 'newJohnDoe',
      phone: '011980028944',
    };
    it('happy path: returns the user profile updated returned by prisma', async () => {
      (prisma.user?.update as jest.Mock).mockResolvedValueOnce({
        ...mockUserEntity,
        ...mockUpdateUserDTO,
      });

      const result = await service.update(mockPayloadJwt, mockUpdateUserDTO);

      expect(result).toEqual({
        ...mockUserEntity,
        ...mockUpdateUserDTO,
      });
      expect(prisma.user?.update).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.user?.update as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(
        service.update(mockPayloadJwt, mockUpdateUserDTO),
      ).rejects.toEqual(prismaNotFoundError);
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.user?.update as jest.Mock).mockRejectedValueOnce(unknownError);

      await expect(
        service.update(mockPayloadJwt, mockUpdateUserDTO),
      ).rejects.toBe(unknownError);
    });
  });
  describe('registerDevice', () => {
    const mockDeviceId: DeviceIdDTO = {
      deviceId: 'abc123de',
    };
    it('happy path: returns the deviceId returned by prisma', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValue({
        deviceId: mockDeviceId.deviceId,
      });

      const result = await service.registerDevice(mockPayloadJwt, mockDeviceId);

      expect(result).toEqual(mockDeviceId);
      expect(prisma.elderProfile?.update).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.elderProfile?.update as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(
        service.registerDevice(mockPayloadJwt, mockDeviceId),
      ).rejects.toEqual(prismaNotFoundError);
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.elderProfile?.update as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(
        service.registerDevice(mockPayloadJwt, mockDeviceId),
      ).rejects.toBe(unknownError);
    });
    it('should throw if prisma returns object without deviceId', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValueOnce({
        userId: 1,
        caregiverId: null,
        deviceId: null,
        bpm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.registerDevice(mockPayloadJwt, mockDeviceId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
