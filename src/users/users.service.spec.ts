import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { PushTokenService } from 'src/push-token/push-token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { DeviceIdDTO } from './dto/device-id.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: Partial<PrismaService>;
  let pushToken: Partial<PushTokenService>;

  const date = new Date('2025-09-08T17:25:18.802Z');
  const mockUserEntity: UserEntity = {
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
  const mockPayloadJwt: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
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
    const mockUpdateUserDTO: UpdateUserDto = {
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
  describe('remove', () => {
    it('happy path: call prisma.user.delete with correct where and resolves', async () => {
      (prisma.user?.deleteMany as jest.Mock).mockResolvedValueOnce(
        mockPayloadJwt.userId,
      );

      await expect(service.remove(mockPayloadJwt)).resolves.toBeUndefined();
      expect(prisma.user?.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.user?.deleteMany).toHaveBeenCalledWith({
        where: { id: mockPayloadJwt.userId },
      });
    });
    it('deleteMany path: resolves even if no record', async () => {
      (prisma.user?.deleteMany as jest.Mock).mockResolvedValueOnce({
        count: 0,
      });

      await expect(service.remove(mockPayloadJwt)).resolves.toBeUndefined();
      expect(prisma.user?.deleteMany).toHaveBeenCalledWith({
        where: { id: mockPayloadJwt.userId },
      });
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.user?.deleteMany as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.remove(mockPayloadJwt)).rejects.toBe(unknownError);
    });
  });
  describe('sendBPM', () => {
    const mockHeartBeatDTO: HeartBeatDTO = {
      bpm: 72,
    };
    const mockHeartBeatResponseDTO: HeartBeatResponseDTO = {
      ...mockHeartBeatDTO,
      updatedAt: date,
    };
    it('happy path: returns the bpm and updatedAt returned by prisma and sends the notification when the bpm is greater than 120 e the caregiverId exist', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValueOnce({
        bpm: 121,
        updatedAt: date,
        caregiverId: 1,
        user: {
          name: 'johnDoe',
        },
      });
      (pushToken.send as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.sendBPM(mockPayloadJwt, { bpm: 121 }),
      ).resolves.toEqual({ bpm: 121, updatedAt: date });
      expect(prisma.elderProfile?.update).toHaveBeenCalledTimes(1);
      expect(pushToken.send).toHaveBeenCalledTimes(1);
    });
    it('returns the bpm and updatedAt returned by prisma and does not send the notification when the bpm is less than or equal to 120', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValueOnce(
        mockHeartBeatResponseDTO,
      );

      await expect(
        service.sendBPM(mockPayloadJwt, {
          bpm: mockHeartBeatDTO.bpm,
        }),
      ).resolves.toEqual(mockHeartBeatResponseDTO);
      expect(prisma.elderProfile?.update).toHaveBeenCalledTimes(1);
      expect(pushToken.send).not.toHaveBeenCalled();
    });
    it('should throw if prisma returns bpm value equals null', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValueOnce({
        bpm: null,
        updatedAt: date,
      });

      await expect(
        service.sendBPM(mockPayloadJwt, mockHeartBeatDTO),
      ).rejects.toThrow(InternalServerErrorException);
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
        service.sendBPM(mockPayloadJwt, mockHeartBeatDTO),
      ).rejects.toEqual(prismaNotFoundError);
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.elderProfile?.update as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(
        service.sendBPM(mockPayloadJwt, mockHeartBeatDTO),
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
