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

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
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

  describe('registerDevice', () => {
    const mockPayloadJwt: JwtPayloadDTO = {
      role: 'elder',
      userId: 1,
    };
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
