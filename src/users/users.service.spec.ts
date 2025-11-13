import { Test, TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { PushTokenService } from 'src/push-token/push-token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { DeviceIdDTO } from './dto/device-id.dto';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: Partial<PrismaService>;
  let pushToken: Partial<PushTokenService>;
  let tx: {
    elderProfile: {
      findUnique: jest.Mock<any, any, any>;
      findFirst: jest.Mock<any, any, any>;
      updateMany: jest.Mock<any, any, any>;
    };
    caregiverProfile: {
      findUnique: jest.Mock<any, any, any>;
    };
  };

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
  const mockDeviceId = 'Qwerty12';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      elderProfile: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      caregiverProfile: {
        update: jest.fn(),
        findUnique: jest.fn(),
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
  describe('createElderLink', () => {
    it('happy path: the link is created and deviceId is returned by prisma', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValueOnce(null),
            updateMany: jest.fn().mockResolvedValueOnce(true),
          },
          caregiverProfile: {
            findUnique: jest.fn().mockResolvedValueOnce({
              elder: {
                deviceId: mockDeviceId,
              },
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.createElderLink(mockPayloadJwt, {
        deviceId: mockDeviceId,
      });

      expect(result).toEqual(result);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.updateMany).toHaveBeenCalledTimes(1);
      expect(tx.caregiverProfile.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should throw a NotFoundException when the deviceId entered by the caregiver is not yet registered', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(null),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
          },
          caregiverProfile: {
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createElderLink(mockPayloadJwt, {
          deviceId: mockDeviceId,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).not.toHaveBeenCalled();
      expect(tx.elderProfile.updateMany).not.toHaveBeenCalled();
      expect(tx.caregiverProfile.findUnique).not.toHaveBeenCalled();
    });
    it('should throw a ConflictException when the user device is already linked to another caregiver', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(true),
            updateMany: jest.fn(),
          },
          caregiverProfile: {
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createElderLink(mockPayloadJwt, {
          deviceId: mockDeviceId,
        }),
      ).rejects.toThrow(ConflictException);
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.updateMany).not.toHaveBeenCalled();
      expect(tx.caregiverProfile.findUnique).not.toHaveBeenCalled();
    });
    it('should throw InternalServerErrorException if prisma returns object without deviceId', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockResolvedValueOnce(true),
          },
          caregiverProfile: {
            findUnique: jest.fn().mockResolvedValueOnce({
              elder: {
                deviceId: null,
              },
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createElderLink(mockPayloadJwt, {
          deviceId: mockDeviceId,
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.updateMany).toHaveBeenCalledTimes(1);
      expect(tx.caregiverProfile.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockRejectedValueOnce(unknownError),
          },
          caregiverProfile: {
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createElderLink(mockPayloadJwt, { deviceId: mockDeviceId }),
      ).rejects.toBe(unknownError);
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.updateMany).toHaveBeenCalledTimes(1);
      expect(tx.caregiverProfile.findUnique).not.toHaveBeenCalled();
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockRejectedValueOnce(prismaNotFoundError),
          },
          caregiverProfile: {
            findUnique: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.createElderLink(mockPayloadJwt, { deviceId: mockDeviceId }),
      ).rejects.toEqual(prismaNotFoundError);
      expect(tx.elderProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.elderProfile.updateMany).toHaveBeenCalledTimes(1);
      expect(tx.caregiverProfile.findUnique).not.toHaveBeenCalled();
    });
  });
  describe('deleteElderLink', () => {
    it('happy path: should unlink the relation between elder and caregiver and return void', async () => {
      (prisma.caregiverProfile?.update as jest.Mock).mockResolvedValueOnce(
        true,
      );

      await expect(
        service.deleteElderLink(mockPayloadJwt),
      ).resolves.toBeUndefined();
      expect(prisma.caregiverProfile?.update).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.caregiverProfile?.update as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(service.deleteElderLink(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.caregiverProfile?.update as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.deleteElderLink(mockPayloadJwt)).rejects.toBe(
        unknownError,
      );
    });
  });
  describe('getElderLinked', () => {
    const mockElder = {
      name: 'example',
      phone: '9987654321',
      elderProfile: {
        deviceId: mockDeviceId,
        bpm: 72,
      },
    };
    it('happy path: should returns name, phone, deviceId, and bpm by prisma', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        elder: {
          userId: 1,
        },
      });
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce(mockElder);

      await expect(service.getElderLinked(mockPayloadJwt)).resolves.toEqual({
        name: mockElder.name,
        phone: mockElder.phone,
        deviceId: mockElder.elderProfile.deviceId,
        bpm: mockElder.elderProfile.bpm,
      });
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should throw NotFoundException when the caregiver does not have a elder assigned to them', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        elder: {
          userId: null,
        },
      });

      await expect(service.getElderLinked(mockPayloadJwt)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).not.toHaveBeenCalled();
    });
    it('should throw InternalServerErrorException when any value in the response object is null', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        elder: {
          userId: 1,
        },
      });
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockElder,
        name: null,
      });

      await expect(service.getElderLinked(mockPayloadJwt)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(service.getElderLinked(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).not.toHaveBeenCalled();
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        elder: {
          userId: 1,
        },
      });
      const unknownError = new Error('connection error');
      (prisma.user?.findUnique as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.getElderLinked(mockPayloadJwt)).rejects.toBe(
        unknownError,
      );
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
  });
  describe('getCaregiverLinked', () => {
    it('happy path: should returns the name and phone by prisma', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        caregiverId: 1,
      });
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce({
        name: 'example',
        phone: '9987654321',
      });

      await expect(service.getCaregiverLinked(mockPayloadJwt)).resolves.toEqual(
        { name: 'example', phone: '9987654321' },
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should throw NotFoundException when the elder does not have a caregiver assigned to them', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        caregiverId: null,
      });

      await expect(service.getCaregiverLinked(mockPayloadJwt)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).not.toHaveBeenCalled();
    });
    it('should throw InternalServerErrorException when the name or phone is null', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        caregiverId: 1,
      });
      (prisma.user?.findUnique as jest.Mock).mockResolvedValueOnce({
        name: null,
        phone: null,
      });

      await expect(service.getCaregiverLinked(mockPayloadJwt)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.elderProfile?.findUnique as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(service.getCaregiverLinked(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).not.toHaveBeenCalled();
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        caregiverId: 1,
      });
      const unknownError = new Error('connection error');
      (prisma.user?.findUnique as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.getCaregiverLinked(mockPayloadJwt)).rejects.toBe(
        unknownError,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user?.findUnique).toHaveBeenCalledTimes(1);
    });
  });
  describe('getDevice', () => {
    it('happy path: should returns the deviceId by prisma when the role is "elder"', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        deviceId: 'Qwerty12',
      });

      await expect(service.getDevice(mockPayloadJwt)).resolves.toEqual({
        deviceId: 'Qwerty12',
      });
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.caregiverProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('happy path: should returns the deviceId by prisma when the role is "caregiver"', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        elder: {
          deviceId: 'Qwerty12',
        },
      });

      await expect(
        service.getDevice({ role: 'caregiver', userId: 1 }),
      ).resolves.toEqual({
        deviceId: 'Qwerty12',
      });
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.elderProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('should throw InternalServerErrorException when the role not is "elder" neither "caregiver"', async () => {
      await expect(
        // @ts-expect-error TS2345: passing string to test for runtime error
        service.getDevice({ role: 'invalid', userId: 1 }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(prisma.elderProfile?.findUnique).not.toHaveBeenCalled();
      expect(prisma.caregiverProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException when the role is "elder" and deviceId is null', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        deviceId: null,
      });

      await expect(service.getDevice(mockPayloadJwt)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.caregiverProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('should throw NotFoundException when the role is "caregiver" and deviceId is null', async () => {
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        deviceId: null,
      });

      await expect(
        service.getDevice({ role: 'caregiver', userId: 1 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.elderProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.elderProfile?.findUnique as jest.Mock).mockRejectedValueOnce(
        prismaNotFoundError,
      );

      await expect(service.getDevice(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
      expect(prisma.elderProfile?.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.caregiverProfile?.findUnique).not.toHaveBeenCalled();
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      (prisma.elderProfile?.findUnique as jest.Mock).mockResolvedValueOnce({
        deviceId: 'Qwerty12',
      });
      const unknownError = new Error('connection error');
      (prisma.caregiverProfile?.findUnique as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(
        service.getDevice({ role: 'caregiver', userId: 1 }),
      ).rejects.toBe(unknownError);
      expect(prisma.elderProfile?.findUnique).not.toHaveBeenCalled();
      expect(prisma.caregiverProfile?.findUnique).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteDevice', () => {
    it('happy path: deletes the device registered and returns void', async () => {
      (prisma.elderProfile?.update as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        service.deleteDevice(mockPayloadJwt),
      ).resolves.toBeUndefined();
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

      await expect(service.deleteDevice(mockPayloadJwt)).rejects.toEqual(
        prismaNotFoundError,
      );
      expect(prisma.elderProfile?.update).toHaveBeenCalledTimes(1);
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.elderProfile?.update as jest.Mock).mockRejectedValueOnce(
        unknownError,
      );

      await expect(service.deleteDevice(mockPayloadJwt)).rejects.toBe(
        unknownError,
      );
      expect(prisma.elderProfile?.update).toHaveBeenCalledTimes(1);
    });
  });
});
