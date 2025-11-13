import { Test, TestingModule } from '@nestjs/testing';
import Expo from 'expo-server-sdk';

import { PushTokenService } from './push-token.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('pushTokenService', () => {
  let service: PushTokenService;
  let prisma: Partial<PrismaService>;
  let expo: Partial<Expo>;
  let tx: {
    pushToken: {
      findUnique: jest.Mock<any, any, any>;
      update: jest.Mock<any, any, any>;
    };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
    };
    expo = {
      sendPushNotificationsAsync: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PushTokenService,
        { provide: PrismaService, useValue: prisma },
        { provide: Expo, useValue: expo },
      ],
    }).compile();

    service = moduleRef.get(PushTokenService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('send', () => {
    const fixedTime = new Date('2025-01-01T12:05:00.000Z').getTime();
    const mockSendPayload = {
      caregiverId: 1,
      name: 'example',
      bpm: 72,
    };

    it('happy path: the push notification is send for EXPO API', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(fixedTime);
      (prisma.$transaction as jest.Mock).mockImplementation((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockResolvedValueOnce({
              expoTokenPush: 'expoToken',
              lastSentAt: new Date('2025-01-01T12:04:29.000Z'),
            }),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        (expo.sendPushNotificationsAsync as jest.Mock).mockResolvedValueOnce(
          true,
        );
        return callback(tx);
      });

      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(tx.pushToken.update).toHaveBeenCalledTimes(1);
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
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime);

      (expo.sendPushNotificationsAsync as jest.Mock).mockResolvedValue(true);

      // 1° call -> should send notification
      (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockResolvedValueOnce({
              expoTokenPush: 'expoToken',
              lastSentAt: new Date(fixedTime - 31_000), // 12:04:29
            }),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        return callback(tx);
      });
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(tx.pushToken.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.pushToken.update).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(expo.sendPushNotificationsAsync).toHaveBeenCalledWith([
        {
          to: 'expoToken',
          sound: 'default',
          title: 'Atenção!',
          body: `BPM elevado detectado para ${mockSendPayload.name}: ${mockSendPayload.bpm}`,
        },
      ]);

      (prisma.$transaction as jest.Mock).mockReset();
      (expo.sendPushNotificationsAsync as jest.Mock).mockClear();
      // 2° call -> do not send
      (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockResolvedValueOnce({
              expoTokenPush: 'expoToken',
              lastSentAt: new Date(fixedTime - 20_000), // 12:04:40
            }),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        return callback(tx);
      });
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(tx.pushToken.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.pushToken.update).not.toHaveBeenCalled();
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();

      (prisma.$transaction as jest.Mock).mockReset();
      // 3° call -> do not send
      (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockResolvedValueOnce({
              expoTokenPush: 'expoToken',
              lastSentAt: new Date(fixedTime - 10_000), // 12:04:50
            }),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        return callback(tx);
      });
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).resolves.toBeUndefined();
      expect(tx.pushToken.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.pushToken.update).not.toHaveBeenCalled();
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
    it('should propagate other DB errors as InternalServerError (or original)', async () => {
      const unknownError = new Error('connection error');
      (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockRejectedValueOnce(unknownError),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        return callback(tx);
      });
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).rejects.toBe(unknownError);
      expect(tx.pushToken.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.pushToken.update).not.toHaveBeenCalled();
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
    it('should propagate not-found error from prisma (simulating P2025)', async () => {
      const prismaNotFoundError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
        tx = {
          pushToken: {
            findUnique: jest.fn().mockRejectedValueOnce(prismaNotFoundError),
            update: jest.fn().mockResolvedValueOnce(true),
          },
        };
        return callback(tx);
      });
      await expect(
        service.send(
          mockSendPayload.caregiverId,
          mockSendPayload.name,
          mockSendPayload.bpm,
        ),
      ).rejects.toEqual(prismaNotFoundError);
      expect(tx.pushToken.findUnique).toHaveBeenCalledTimes(1);
      expect(tx.pushToken.update).not.toHaveBeenCalled();
      expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
    });
  });
  //
});
