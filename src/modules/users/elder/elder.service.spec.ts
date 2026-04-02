jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushNotificationService } from 'src/modules/push-notification/push-notification.service';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { HeartBeatDTO, HeartBeatResponseDTO } from '../dto/heart-beat.dto';
import { ElderService } from './elder.service';

describe('ElderService', () => {
  let service: ElderService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
    elderProfile: {
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let pushNotificationService: {
    send: jest.Mock;
  };

  const date = new Date('2025-09-08T17:25:18.802Z');
  const payload: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      elderProfile: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    pushNotificationService = {
      send: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ElderService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PushNotificationService,
          useValue: pushNotificationService,
        },
      ],
    }).compile();

    service = moduleRef.get(ElderService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('sendBPM', () => {
    const heartBeatDto: HeartBeatDTO = { bpm: 72 };
    const response: HeartBeatResponseDTO = {
      bpm: 72,
      updatedAt: date,
    };

    it('returns the bpm update without notification when bpm is within the limit', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce(response);

      await expect(service.sendBPM(payload, heartBeatDto)).resolves.toEqual(
        response,
      );
      expect(pushNotificationService.send).not.toHaveBeenCalled();
    });

    it('sends a notification when bpm is above the limit and caregiver exists', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce({
        bpm: 121,
        updatedAt: date,
        caregiverId: 10,
        user: { name: 'John Doe' },
      });

      await expect(service.sendBPM(payload, { bpm: 121 })).resolves.toEqual({
        bpm: 121,
        updatedAt: date,
      });
      expect(pushNotificationService.send).toHaveBeenCalledWith(
        10,
        'John Doe',
        121,
      );
    });

    it('throws when prisma returns a null bpm', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce({
        bpm: null,
        updatedAt: date,
      });

      await expect(service.sendBPM(payload, heartBeatDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.elderProfile.update.mockRejectedValueOnce(prismaError);

      await expect(service.sendBPM(payload, heartBeatDto)).rejects.toBe(
        prismaError,
      );
    });
  });

  describe('registerDevice', () => {
    const deviceId: DeviceIdDTO = {
      deviceId: 'abc123de',
    };

    it('returns the registered device id', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce(deviceId);

      await expect(service.registerDevice(payload, deviceId)).resolves.toEqual(
        deviceId,
      );
    });

    it('throws when prisma returns a null device id', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce({
        deviceId: null,
      });

      await expect(service.registerDevice(payload, deviceId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.elderProfile.update.mockRejectedValueOnce(prismaError);

      await expect(service.registerDevice(payload, deviceId)).rejects.toBe(
        prismaError,
      );
    });
  });

  describe('getCaregiverLinked', () => {
    it('returns the caregiver profile', async () => {
      prisma.elderProfile.findUnique.mockResolvedValueOnce({ caregiverId: 7 });
      prisma.user.findUnique.mockResolvedValueOnce({
        name: 'Example',
        phone: '9987654321',
      });

      await expect(service.getCaregiverLinked(payload)).resolves.toEqual({
        name: 'Example',
        phone: '9987654321',
      });
    });

    it('throws when the elder has no caregiver linked', async () => {
      prisma.elderProfile.findUnique.mockResolvedValueOnce({
        caregiverId: null,
      });

      await expect(service.getCaregiverLinked(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when caregiver data is incomplete', async () => {
      prisma.elderProfile.findUnique.mockResolvedValueOnce({ caregiverId: 7 });
      prisma.user.findUnique.mockResolvedValueOnce({
        name: null,
        phone: null,
      });

      await expect(service.getCaregiverLinked(payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.elderProfile.findUnique.mockRejectedValueOnce(prismaError);

      await expect(service.getCaregiverLinked(payload)).rejects.toBe(
        prismaError,
      );
    });
  });

  describe('getDevice', () => {
    it('returns the elder device id', async () => {
      prisma.elderProfile.findUnique.mockResolvedValueOnce({
        deviceId: 'Qwerty12',
      });

      await expect(service.getDevice(payload)).resolves.toEqual({
        deviceId: 'Qwerty12',
      });
    });

    it('throws when device id is missing', async () => {
      prisma.elderProfile.findUnique.mockResolvedValueOnce({
        deviceId: null,
      });

      await expect(service.getDevice(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.elderProfile.findUnique.mockRejectedValueOnce(prismaError);

      await expect(service.getDevice(payload)).rejects.toBe(prismaError);
    });
  });

  describe('deleteDevice', () => {
    it('clears the device and link data', async () => {
      prisma.elderProfile.update.mockResolvedValueOnce(true);

      await expect(service.deleteDevice(payload)).resolves.toBeUndefined();
      expect(prisma.elderProfile.update).toHaveBeenCalledWith({
        where: { userId: payload.userId },
        data: {
          deviceId: null,
          bpm: null,
          caregiverId: null,
        },
      });
    });

    it('propagates prisma errors', async () => {
      const prismaError = new Error('connection error');
      prisma.elderProfile.update.mockRejectedValueOnce(prismaError);

      await expect(service.deleteDevice(payload)).rejects.toBe(prismaError);
    });
  });
});
