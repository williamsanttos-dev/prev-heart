import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { ALERT_NOTIFIER } from '../health-monitoring.tokens';
import {
  type AlertNotifier,
  NotifyHighHeartRateInput,
} from '../interfaces/alert-notifier.interface';

export interface IProcessHeartRateAlertService {
  execute(input: {
    elderId: number;
    caregiverId: number;
    bpm: number;
    measuredAt: Date;
  }): Promise<void>;
}

@Injectable()
export class ProcessHeartRateAlertService
  implements IProcessHeartRateAlertService
{
  private readonly logger = new Logger(ProcessHeartRateAlertService.name);

  private readonly HEART_RATE_THRESHOLD = 120;
  private readonly RECOVERY_THRESHOLD = 110;
  private readonly REQUIRED_CONSECUTIVE_CRITICAL = 2;
  private readonly REQUIRED_CONSECUTIVE_NORMAL = 2;
  private readonly NOTIFICATION_GAP_MS = 10 * 60 * 1000;

  constructor(
    @Inject(ALERT_NOTIFIER)
    private readonly alertNotifier: AlertNotifier,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: {
    elderId: number;
    caregiverId: number;
    bpm: number;
    measuredAt: Date;
  }): Promise<void> {
    if (!input.caregiverId) {
      this.logger.warn(
        `High heart rate detected for elder ${input.elderId}, but no caregiver was provided`,
      );
      return;
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const heartRateState = await tx.heartRateMeasurement.findFirst({
        where: {
          elderId: input.elderId,
        },
        select: {
          id: true,
          elderId: true,
          consecutiveNormalReadings: true,
          consecutiveCriticalReadings: true,
          criticalSince: true,
          status: true,
        },
        orderBy: {
          measuredAt: 'desc',
        },
      });

      if (!heartRateState) {
        throw new Error('INTERNAL_SERVER_ERROR');
      }

      const previousStatus = heartRateState.status;

      let consecutiveCriticalReadings =
        heartRateState.consecutiveCriticalReadings;
      let consecutiveNormalReadings = heartRateState.consecutiveNormalReadings;
      let nextStatus = heartRateState.status;
      let criticalSince = heartRateState.criticalSince;

      if (input.bpm > this.HEART_RATE_THRESHOLD) {
        consecutiveCriticalReadings += 1;
        consecutiveNormalReadings = 0;

        if (consecutiveCriticalReadings >= this.REQUIRED_CONSECUTIVE_CRITICAL) {
          nextStatus = 'CRITICAL';

          if (previousStatus !== 'CRITICAL') {
            criticalSince = now;
          }
        }
      } else if (input.bpm < this.RECOVERY_THRESHOLD) {
        consecutiveNormalReadings += 1;
        consecutiveCriticalReadings = 0;

        if (consecutiveNormalReadings >= this.REQUIRED_CONSECUTIVE_NORMAL) {
          nextStatus = 'NORMAL';
          criticalSince = null;
        }
      } else {
        // Faixa intermediária: 110..120
        // Evita oscilar estado agressivamente.
        consecutiveCriticalReadings = 0;
        consecutiveNormalReadings = 0;
      }

      await tx.heartRateMeasurement.update({
        where: {
          id: heartRateState.id,
        },
        data: {
          consecutiveCriticalReadings,
          consecutiveNormalReadings,
          status: nextStatus,
          criticalSince,
        },
      });

      const caregiverPushToken = await tx.pushToken.findFirst({
        where: {
          userId: input.caregiverId,
        },
        select: {
          expoTokenPush: true,
          lastSentAt: true,
        },
      });

      const elder = await tx.user.findUnique({
        where: {
          id: input.elderId,
        },
        select: {
          name: true,
        },
      });

      if (!elder) {
        throw new Error('INTERNAL_SERVER_ERROR');
      }

      const canNotifyByGap =
        !caregiverPushToken?.lastSentAt ||
        now.getTime() - caregiverPushToken.lastSentAt.getTime() >=
          this.NOTIFICATION_GAP_MS;

      const shouldNotify =
        nextStatus === 'CRITICAL' &&
        consecutiveCriticalReadings >= this.REQUIRED_CONSECUTIVE_CRITICAL &&
        canNotifyByGap;

      return {
        shouldNotify,
        elderName: elder.name,
        token: caregiverPushToken?.expoTokenPush,
      };
    });

    if (!result.shouldNotify) {
      return;
    }

    if (!result.token) {
      this.logger.warn(
        `Critical heart rate detected for elder ${input.elderId}, but caregiver ${input.caregiverId} has no push token`,
      );
      return;
    }

    const payload: NotifyHighHeartRateInput = {
      elderId: input.elderId,
      caregiverId: input.caregiverId,
      bpm: input.bpm,
      measuredAt: input.measuredAt,
      threshold: this.HEART_RATE_THRESHOLD,
      elderName: result.elderName,
    };

    await this.alertNotifier.notifyHighHeartRate(payload);

    await this.prisma.pushToken.update({
      where: {
        userId: input.caregiverId,
        expoTokenPush: result.token,
      },
      data: {
        lastSentAt: new Date(),
      },
    });

    this.logger.warn(
      `High heart rate alert sent for elder ${input.elderId}: ${input.bpm} bpm`,
    );
  }
}
