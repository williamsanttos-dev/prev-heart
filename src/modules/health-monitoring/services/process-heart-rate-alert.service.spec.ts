/* eslint-disable @typescript-eslint/require-await*/

import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';

import { ALERT_NOTIFIER } from '../health-monitoring.tokens';
import type { AlertNotifier } from '../interfaces/alert-notifier.interface';
import { ProcessHeartRateAlertService } from './process-heart-rate-alert.service';

describe('ProcessHeartRateAlertService', () => {
  let service: ProcessHeartRateAlertService;
  let alertNotifier: {
    notifyHighHeartRate: jest.Mock;
  };
  let prisma: {
    $transaction: jest.Mock;
    pushToken: {
      update: jest.Mock;
    };
  };
  let loggerWarnSpy: jest.SpyInstance;

  const now = new Date('2026-04-05T14:00:00.000Z');
  const measuredAt = new Date('2026-04-05T13:55:00.000Z');

  const input = {
    elderId: 1,
    caregiverId: 2,
    bpm: 130,
    measuredAt,
  };

  const createTransactionContext = (overrides?: {
    heartRateState?: Partial<{
      id: number;
      elderId: number;
      consecutiveNormalReadings: number;
      consecutiveCriticalReadings: number;
      criticalSince: Date | null;
      status: 'NORMAL' | 'CRITICAL';
    }> | null;
    caregiverPushToken?: Partial<{
      expoTokenPush: string | null;
      lastSentAt: Date | null;
    }> | null;
    elder?: Partial<{
      name: string;
    }> | null;
  }) => {
    const heartRateState =
      overrides?.heartRateState === null
        ? null
        : {
            id: 10,
            elderId: input.elderId,
            consecutiveNormalReadings: 0,
            consecutiveCriticalReadings: 0,
            criticalSince: null,
            status: 'NORMAL' as const,
            ...overrides?.heartRateState,
          };

    const caregiverPushToken =
      overrides?.caregiverPushToken === null
        ? null
        : {
            expoTokenPush: 'ExpoPushToken[test]',
            lastSentAt: null,
            ...overrides?.caregiverPushToken,
          };

    const elder =
      overrides?.elder === null
        ? null
        : {
            name: 'Maria',
            ...overrides?.elder,
          };

    return {
      heartRateMeasurement: {
        findFirst: jest.fn().mockResolvedValue(heartRateState),
        update: jest.fn().mockResolvedValue(undefined),
      },
      pushToken: {
        findFirst: jest.fn().mockResolvedValue(caregiverPushToken),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(elder),
      },
    };
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);

    alertNotifier = {
      notifyHighHeartRate: jest.fn(),
    };

    prisma = {
      $transaction: jest.fn(),
      pushToken: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessHeartRateAlertService,
        {
          provide: ALERT_NOTIFIER,
          useValue: alertNotifier satisfies jest.Mocked<AlertNotifier>,
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProcessHeartRateAlertService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('returns early and logs a warning when no caregiver is provided', async () => {
    await expect(
      service.execute({
        ...input,
        caregiverId: 0,
      }),
    ).resolves.toBeUndefined();

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'High heart rate detected for elder 1, but no caregiver was provided',
    );
  });

  it('throws when no previous heart rate state exists', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback(createTransactionContext({ heartRateState: null })),
    );

    await expect(service.execute(input)).rejects.toThrow(
      'INTERNAL_SERVER_ERROR',
    );
  });

  it('updates counters without notifying on the first critical reading', async () => {
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 0,
        consecutiveNormalReadings: 1,
        status: 'NORMAL',
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.execute(input)).resolves.toBeUndefined();

    expect(tx.heartRateMeasurement.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        consecutiveCriticalReadings: 1,
        consecutiveNormalReadings: 0,
        status: 'NORMAL',
        criticalSince: null,
      },
    });
    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
    expect(prisma.pushToken.update).not.toHaveBeenCalled();
  });

  it('sends an alert when the second consecutive critical reading crosses the threshold', async () => {
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 1,
        consecutiveNormalReadings: 0,
        criticalSince: null,
        status: 'NORMAL',
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.execute(input)).resolves.toBeUndefined();

    expect(tx.heartRateMeasurement.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        consecutiveCriticalReadings: 2,
        consecutiveNormalReadings: 0,
        status: 'CRITICAL',
        criticalSince: now,
      },
    });
    expect(alertNotifier.notifyHighHeartRate).toHaveBeenCalledWith({
      elderId: 1,
      caregiverId: 2,
      bpm: 130,
      measuredAt,
      threshold: 120,
      elderName: 'Maria',
    });
    expect(prisma.pushToken.update).toHaveBeenCalledWith({
      where: {
        userId: 2,
        expoTokenPush: 'ExpoPushToken[test]',
      },
      data: {
        lastSentAt: now,
      },
    });
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'High heart rate alert sent for elder 1: 130 bpm',
    );
  });

  it('does not notify again when the cooldown gap has not elapsed', async () => {
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 2,
        consecutiveNormalReadings: 0,
        criticalSince: new Date('2026-04-05T13:40:00.000Z'),
        status: 'CRITICAL',
      },
      caregiverPushToken: {
        expoTokenPush: 'ExpoPushToken[test]',
        lastSentAt: new Date('2026-04-05T13:55:30.000Z'),
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.execute(input)).resolves.toBeUndefined();

    expect(tx.heartRateMeasurement.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        consecutiveCriticalReadings: 3,
        consecutiveNormalReadings: 0,
        status: 'CRITICAL',
        criticalSince: new Date('2026-04-05T13:40:00.000Z'),
      },
    });
    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
    expect(prisma.pushToken.update).not.toHaveBeenCalled();
  });

  it('logs a warning instead of notifying when a critical alert has no push token', async () => {
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 1,
        status: 'NORMAL',
      },
      caregiverPushToken: {
        expoTokenPush: null,
        lastSentAt: null,
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(service.execute(input)).resolves.toBeUndefined();

    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
    expect(prisma.pushToken.update).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Critical heart rate detected for elder 1, but caregiver 2 has no push token',
    );
  });

  it('returns the status to NORMAL after the required consecutive recovery readings', async () => {
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 3,
        consecutiveNormalReadings: 1,
        criticalSince: new Date('2026-04-05T13:40:00.000Z'),
        status: 'CRITICAL',
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.execute({
        ...input,
        bpm: 90,
      }),
    ).resolves.toBeUndefined();

    expect(tx.heartRateMeasurement.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        consecutiveCriticalReadings: 0,
        consecutiveNormalReadings: 2,
        status: 'NORMAL',
        criticalSince: null,
      },
    });
    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
  });

  it('resets both counters for an intermediate reading without changing the current status', async () => {
    const criticalSince = new Date('2026-04-05T13:40:00.000Z');
    const tx = createTransactionContext({
      heartRateState: {
        consecutiveCriticalReadings: 2,
        consecutiveNormalReadings: 1,
        criticalSince,
        status: 'CRITICAL',
      },
    });

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.execute({
        ...input,
        bpm: 115,
      }),
    ).resolves.toBeUndefined();

    expect(tx.heartRateMeasurement.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        consecutiveCriticalReadings: 0,
        consecutiveNormalReadings: 0,
        status: 'CRITICAL',
        criticalSince,
      },
    });
    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
  });

  it('throws when the elder cannot be found inside the transaction', async () => {
    prisma.$transaction.mockImplementation(async (callback) =>
      callback(createTransactionContext({ elder: null })),
    );

    await expect(service.execute(input)).rejects.toThrow(
      'INTERNAL_SERVER_ERROR',
    );
    expect(alertNotifier.notifyHighHeartRate).not.toHaveBeenCalled();
  });
});
