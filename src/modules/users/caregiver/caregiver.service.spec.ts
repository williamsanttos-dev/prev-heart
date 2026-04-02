jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaregiverService } from './caregiver.service';

describe('CaregiverService', () => {
  let service: CaregiverService;
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findUnique: jest.Mock;
    };
    caregiverProfile: {
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let tx: {
    elderProfile: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
    caregiverProfile: {
      findUnique: jest.Mock;
    };
  };

  const payload: JwtPayloadDTO = {
    role: 'caregiver',
    userId: 1,
  };
  const mockDeviceId = 'Qwerty12';

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      user: {
        findUnique: jest.fn(),
      },
      caregiverProfile: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CaregiverService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(CaregiverService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('createElderLink', () => {
    it('creates the link and returns the device id', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockResolvedValue(true),
          },
          caregiverProfile: {
            findUnique: jest.fn().mockResolvedValue({
              elder: {
                deviceId: mockDeviceId,
              },
            }),
          },
        };

        return await callback(tx);
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).resolves.toEqual({
        deviceId: mockDeviceId,
      });
    });

    it('throws when the device is not registered', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
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

        return await callback(tx);
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the device is already linked', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
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

        return await callback(tx);
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws when the linked elder has no device id in the response', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockResolvedValue(true),
          },
          caregiverProfile: {
            findUnique: jest.fn().mockResolvedValue({
              elder: {
                deviceId: null,
              },
            }),
          },
        };

        return await callback(tx);
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.$transaction.mockImplementation(async (callback) => {
        tx = {
          elderProfile: {
            findUnique: jest.fn().mockResolvedValue(true),
            findFirst: jest.fn().mockResolvedValue(null),
            updateMany: jest.fn().mockRejectedValue(prismaError),
          },
          caregiverProfile: {
            findUnique: jest.fn(),
          },
        };

        return await callback(tx);
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toBe(prismaError);
    });
  });

  describe('deleteElderLink', () => {
    it('unlinks the elder from the caregiver', async () => {
      prisma.caregiverProfile.update.mockResolvedValueOnce(true);

      await expect(service.deleteElderLink(payload)).resolves.toBeUndefined();
      expect(prisma.caregiverProfile.update).toHaveBeenCalledWith({
        where: { userId: payload.userId },
        data: { elder: { disconnect: true } },
      });
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.caregiverProfile.update.mockRejectedValueOnce(prismaError);

      await expect(service.deleteElderLink(payload)).rejects.toBe(prismaError);
    });
  });

  describe('getElderLinked', () => {
    it('returns the linked elder profile', async () => {
      prisma.caregiverProfile.findUnique.mockResolvedValueOnce({
        elder: {
          userId: 10,
        },
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        name: 'example',
        phone: '9987654321',
        elderProfile: {
          deviceId: mockDeviceId,
          bpm: 72,
        },
      });

      await expect(service.getElderLinked(payload)).resolves.toEqual({
        name: 'example',
        phone: '9987654321',
        deviceId: mockDeviceId,
        bpm: 72,
      });
    });

    it('throws when the caregiver has no elder linked', async () => {
      prisma.caregiverProfile.findUnique.mockResolvedValueOnce({
        elder: {
          userId: null,
        },
      });

      await expect(service.getElderLinked(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the elder data is incomplete', async () => {
      prisma.caregiverProfile.findUnique.mockResolvedValueOnce({
        elder: {
          userId: 10,
        },
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        name: null,
        phone: '9987654321',
        elderProfile: {
          deviceId: mockDeviceId,
          bpm: 72,
        },
      });

      await expect(service.getElderLinked(payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.caregiverProfile.findUnique.mockRejectedValueOnce(prismaError);

      await expect(service.getElderLinked(payload)).rejects.toBe(prismaError);
    });
  });

  describe('getDevice', () => {
    it('returns the linked elder device id', async () => {
      prisma.caregiverProfile.findUnique.mockResolvedValueOnce({
        elder: {
          deviceId: mockDeviceId,
        },
      });

      await expect(service.getDevice(payload)).resolves.toEqual({
        deviceId: mockDeviceId,
      });
    });

    it('throws when the linked elder has no device', async () => {
      prisma.caregiverProfile.findUnique.mockResolvedValueOnce({
        elder: {
          deviceId: null,
        },
      });

      await expect(service.getDevice(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.caregiverProfile.findUnique.mockRejectedValueOnce(prismaError);

      await expect(service.getDevice(payload)).rejects.toBe(prismaError);
    });
  });
});
