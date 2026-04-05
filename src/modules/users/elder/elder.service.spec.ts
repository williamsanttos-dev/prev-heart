import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import type { IPushNotificationService } from 'src/modules/push-notification/interfaces/push-notification.service.interface';
import { DeviceIdDTO } from '../user/dto/device-id.dto';
import type { IElderRepository } from './interfaces/elder.repository.interface';
import { ElderService } from './elder.service';

describe('ElderService', () => {
  let service: ElderService;
  let elderRepository: {
    // sendBPM: jest.Mock;
    registerDevice: jest.Mock;
    getCaregiverLinked: jest.Mock;
    getDevice: jest.Mock;
    deleteDevice: jest.Mock;
    findAll: jest.Mock;
  };
  let pushNotificationService: {
    send: jest.Mock;
  };

  // const date = new Date('2025-09-08T17:25:18.802Z');
  const payload: JwtPayloadDTO = {
    role: 'elder',
    userId: 1,
  };

  beforeEach(async () => {
    elderRepository = {
      // sendBPM: jest.fn(),
      registerDevice: jest.fn(),
      getCaregiverLinked: jest.fn(),
      getDevice: jest.fn(),
      deleteDevice: jest.fn(),
      findAll: jest.fn(),
    };
    pushNotificationService = {
      send: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'ElderService',
          useClass: ElderService,
        },
        {
          provide: 'ElderRepository',
          useValue: elderRepository satisfies jest.Mocked<IElderRepository>,
        },
        {
          provide: 'PushNotificationService',
          useValue: pushNotificationService satisfies Pick<
            IPushNotificationService,
            'send'
          >,
        },
      ],
    }).compile();

    service = moduleRef.get('ElderService');
  });

  afterEach(() => jest.resetAllMocks());

  // describe('sendBPM', () => {
  //   const heartBeatDto: HeartBeatDTO = { bpm: 72 };
  //   const response: HeartBeatResponseDTO = {
  //     bpm: 72,
  //     updatedAt: date,
  //   };

  //   it('returns the bpm update without notification when bpm is within the limit', async () => {
  //     elderRepository.sendBPM.mockResolvedValueOnce({
  //       ...response,
  //       caregiverId: null,
  //       elderName: 'John Doe',
  //     });

  //     await expect(service.sendBPM(payload, heartBeatDto)).resolves.toEqual(
  //       response,
  //     );
  //     expect(pushNotificationService.send).not.toHaveBeenCalled();
  //   });

  //   it('sends a notification when bpm is above the limit and caregiver exists', async () => {
  //     elderRepository.sendBPM.mockResolvedValueOnce({
  //       bpm: 121,
  //       updatedAt: date,
  //       caregiverId: 10,
  //       elderName: 'John Doe',
  //     });

  //     await expect(service.sendBPM(payload, { bpm: 121 })).resolves.toEqual({
  //       bpm: 121,
  //       updatedAt: date,
  //     });
  //     expect(pushNotificationService.send).toHaveBeenCalledWith(
  //       10,
  //       'John Doe',
  //       121,
  //     );
  //   });

  //   it('throws when repository returns null', async () => {
  //     elderRepository.sendBPM.mockResolvedValueOnce(null);

  //     await expect(service.sendBPM(payload, heartBeatDto)).rejects.toThrow(
  //       InternalServerErrorException,
  //     );
  //   });

  //   it('propagates repository errors', async () => {
  //     const repositoryError = new Error('connection error');
  //     elderRepository.sendBPM.mockRejectedValueOnce(repositoryError);

  //     await expect(service.sendBPM(payload, heartBeatDto)).rejects.toBe(
  //       repositoryError,
  //     );
  //   });
  // });

  describe('registerDevice', () => {
    const deviceId: DeviceIdDTO = {
      deviceId: 'abc123de',
    };

    it('returns the registered device id', async () => {
      elderRepository.registerDevice.mockResolvedValueOnce(deviceId);

      await expect(service.registerDevice(payload, deviceId)).resolves.toEqual(
        deviceId,
      );
    });

    it('throws when repository returns null', async () => {
      elderRepository.registerDevice.mockResolvedValueOnce(null);

      await expect(service.registerDevice(payload, deviceId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      elderRepository.registerDevice.mockRejectedValueOnce(repositoryError);

      await expect(service.registerDevice(payload, deviceId)).rejects.toBe(
        repositoryError,
      );
    });
  });

  describe('getCaregiverLinked', () => {
    it('returns the caregiver profile', async () => {
      elderRepository.getCaregiverLinked.mockResolvedValueOnce({
        name: 'Example',
        phone: '9987654321',
      });

      await expect(service.getCaregiverLinked(payload)).resolves.toEqual({
        name: 'Example',
        phone: '9987654321',
      });
    });

    it('throws when the elder has no caregiver linked', async () => {
      elderRepository.getCaregiverLinked.mockResolvedValueOnce(null);

      await expect(service.getCaregiverLinked(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      elderRepository.getCaregiverLinked.mockRejectedValueOnce(repositoryError);

      await expect(service.getCaregiverLinked(payload)).rejects.toBe(
        repositoryError,
      );
    });
  });

  describe('getDevice', () => {
    it('returns the elder device id', async () => {
      elderRepository.getDevice.mockResolvedValueOnce({
        deviceId: 'Qwerty12',
      });

      await expect(service.getDevice(payload)).resolves.toEqual({
        deviceId: 'Qwerty12',
      });
    });

    it('throws when device id is missing', async () => {
      elderRepository.getDevice.mockResolvedValueOnce(null);

      await expect(service.getDevice(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      elderRepository.getDevice.mockRejectedValueOnce(repositoryError);

      await expect(service.getDevice(payload)).rejects.toBe(repositoryError);
    });
  });

  describe('deleteDevice', () => {
    it('clears the device and link data', async () => {
      elderRepository.deleteDevice.mockResolvedValueOnce(undefined);

      await expect(service.deleteDevice(payload)).resolves.toBeUndefined();
      expect(elderRepository.deleteDevice).toHaveBeenCalledWith(payload);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      elderRepository.deleteDevice.mockRejectedValueOnce(repositoryError);

      await expect(service.deleteDevice(payload)).rejects.toBe(repositoryError);
    });
  });
});
