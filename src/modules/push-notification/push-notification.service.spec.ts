import { Test, TestingModule } from '@nestjs/testing';
import Expo from 'expo-server-sdk';

import { PushNotificationService } from './push-notification.service';
import type { IPushNotificationRepository } from './interfaces/push-notification.repository.interface';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let repository: {
    create: jest.Mock;
    reserveTokenForSend: jest.Mock;
    remove: jest.Mock;
  };
  let expo: Partial<Expo>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      reserveTokenForSend: jest.fn(),
      remove: jest.fn(),
    };
    expo = {
      sendPushNotificationsAsync: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'PushNotificationService',
          useClass: PushNotificationService,
        },
        {
          provide: 'PushNotificationRepository',
          useValue:
            repository satisfies jest.Mocked<IPushNotificationRepository>,
        },
        { provide: Expo, useValue: expo },
      ],
    }).compile();

    service = moduleRef.get('PushNotificationService');
  });

  afterEach(() => jest.resetAllMocks());

  describe('send', () => {
    const mockSendPayload = {
      caregiverId: 1,
      name: 'example',
      bpm: 72,
    };

    it('happy path: the push notification is send for EXPO API', async () => {
      repository.reserveTokenForSend.mockResolvedValueOnce('expoToken');
      (expo.sendPushNotificationsAsync as jest.Mock).mockResolvedValueOnce(
        true,
      );

      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(repository.reserveTokenForSend).toHaveBeenCalledWith(
        mockSendPayload.caregiverId,
        expect.any(Date),
        30,
      );
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledWith([
        {
          to: 'expoToken',
          sound: 'default',
          title: 'Atenção!',
          body: `BPM elevado detectado para ${mockSendPayload.name}: ${mockSendPayload.bpm}`,
        },
      ]);
    });
    it('should only send one push notification every 30 seconds', async () => {
      (expo.sendPushNotificationsAsync as jest.Mock).mockResolvedValue(true);

      // 1° call -> should send notification
      repository.reserveTokenForSend.mockResolvedValueOnce('expoToken');
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledWith([
        {
          to: 'expoToken',
          sound: 'default',
          title: 'Atenção!',
          body: `BPM elevado detectado para ${mockSendPayload.name}: ${mockSendPayload.bpm}`,
        },
      ]);

      repository.reserveTokenForSend.mockReset();
      (expo.sendPushNotificationsAsync as jest.Mock).mockClear();
      // 2° call -> do not send
      repository.reserveTokenForSend.mockResolvedValueOnce(null);
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();

      repository.reserveTokenForSend.mockReset();
      // 3° call -> do not send
      repository.reserveTokenForSend.mockResolvedValueOnce(null);
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      repository.reserveTokenForSend.mockRejectedValueOnce(unknownError);
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).rejects.toBe(unknownError);
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      repository.reserveTokenForSend.mockRejectedValueOnce(prismaNotFoundError);
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).rejects.toEqual(prismaNotFoundError);
      expect(repository.reserveTokenForSend).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
  });
  //
});
