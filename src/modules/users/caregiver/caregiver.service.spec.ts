import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import type { ICaregiverRepository } from './interfaces/caregiver.repository.interface';
import { CaregiverService } from './caregiver.service';

describe('CaregiverService', () => {
  let service: CaregiverService;
  let caregiverRepository: {
    createElderLink: jest.Mock;
    deleteElderLink: jest.Mock;
    getElderLinked: jest.Mock;
    getDevice: jest.Mock;
  };

  const payload: JwtPayloadDTO = {
    role: 'caregiver',
    userId: 1,
  };
  const mockDeviceId = 'Qwerty12';

  beforeEach(async () => {
    caregiverRepository = {
      createElderLink: jest.fn(),
      deleteElderLink: jest.fn(),
      getElderLinked: jest.fn(),
      getDevice: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'CaregiverService',
          useClass: CaregiverService,
        },
        {
          provide: 'CaregiverRepository',
          useValue:
            caregiverRepository satisfies jest.Mocked<ICaregiverRepository>,
        },
      ],
    }).compile();

    service = moduleRef.get('CaregiverService');
  });

  afterEach(() => jest.resetAllMocks());

  describe('createElderLink', () => {
    it('creates the link and returns the device id', async () => {
      caregiverRepository.createElderLink.mockResolvedValueOnce({
        deviceId: mockDeviceId,
      });

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).resolves.toEqual({
        deviceId: mockDeviceId,
      });
    });

    it('throws when the device is not registered', async () => {
      caregiverRepository.createElderLink.mockResolvedValueOnce(null);

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the device is already linked', async () => {
      caregiverRepository.createElderLink.mockResolvedValueOnce({
        conflict: true,
      } as never);

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toThrow(ConflictException);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      caregiverRepository.createElderLink.mockRejectedValueOnce(
        repositoryError,
      );

      await expect(
        service.createElderLink(payload, { deviceId: mockDeviceId }),
      ).rejects.toBe(repositoryError);
    });
  });

  describe('deleteElderLink', () => {
    it('unlinks the elder from the caregiver', async () => {
      caregiverRepository.deleteElderLink.mockResolvedValueOnce(undefined);

      await expect(service.deleteElderLink(payload)).resolves.toBeUndefined();
      expect(caregiverRepository.deleteElderLink).toHaveBeenCalledWith(payload);
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      caregiverRepository.deleteElderLink.mockRejectedValueOnce(
        repositoryError,
      );

      await expect(service.deleteElderLink(payload)).rejects.toBe(
        repositoryError,
      );
    });
  });

  describe('getElderLinked', () => {
    it('returns the linked elder profile', async () => {
      caregiverRepository.getElderLinked.mockResolvedValueOnce({
        name: 'example',
        phone: '9987654321',
        deviceId: mockDeviceId,
        bpm: 72,
      });

      await expect(service.getElderLinked(payload)).resolves.toEqual({
        name: 'example',
        phone: '9987654321',
        deviceId: mockDeviceId,
        bpm: 72,
      });
    });

    it('throws when the caregiver has no elder linked', async () => {
      caregiverRepository.getElderLinked.mockResolvedValueOnce({
        name: null,
        phone: null,
        deviceId: null,
        bpm: null,
      } as never);

      await expect(service.getElderLinked(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the elder data is incomplete', async () => {
      caregiverRepository.getElderLinked.mockResolvedValueOnce({
        name: 'example',
        phone: '9987654321',
        deviceId: mockDeviceId,
        bpm: null,
      } as never);

      await expect(service.getElderLinked(payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      caregiverRepository.getElderLinked.mockRejectedValueOnce(repositoryError);

      await expect(service.getElderLinked(payload)).rejects.toBe(
        repositoryError,
      );
    });
  });

  describe('getDevice', () => {
    it('returns the linked elder device id', async () => {
      caregiverRepository.getDevice.mockResolvedValueOnce({
        deviceId: mockDeviceId,
      });

      await expect(service.getDevice(payload)).resolves.toEqual({
        deviceId: mockDeviceId,
      });
    });

    it('throws when the linked elder has no device', async () => {
      caregiverRepository.getDevice.mockResolvedValueOnce(null);

      await expect(service.getDevice(payload)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates repository errors', async () => {
      const repositoryError = new Error('connection error');
      caregiverRepository.getDevice.mockRejectedValueOnce(repositoryError);

      await expect(service.getDevice(payload)).rejects.toBe(repositoryError);
    });
  });
});
