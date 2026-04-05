import { Inject, Injectable } from '@nestjs/common';

import {
  HEART_RATE_PROVIDER,
  HEART_RATE_REPOSITORY,
  PROCESS_HEART_RATE_ALERT_SERVICE,
} from '../health-monitoring.tokens';
import { type HeartRateProvider } from '../interfaces/heart-rate-provider.interface';
import { type HeartRateRepository } from '../interfaces/heart-rate.repository.interface';
import { type IProcessHeartRateAlertService } from './process-heart-rate-alert.service';

@Injectable()
export class SyncHeartRateService {
  constructor(
    @Inject(HEART_RATE_PROVIDER)
    private readonly heartRateProvider: HeartRateProvider,

    @Inject(HEART_RATE_REPOSITORY)
    private readonly heartRateRepository: HeartRateRepository,

    @Inject(PROCESS_HEART_RATE_ALERT_SERVICE)
    private readonly processHeartRateAlertService: IProcessHeartRateAlertService,
  ) {}

  async execute(
    elderId: number,
    deviceId: string,
    caregiverId: number,
  ): Promise<void> {
    const reading = await this.heartRateProvider.getLatestByElder({
      elderId,
      deviceId,
    });

    if (!reading) return;

    const result = await this.heartRateRepository.save({
      elderId,
      bpm: reading.value,
      measuredAt: reading.measuredAt,
      source: reading.source,
      externalReadingId: reading.externalReadingId,
      rawPayload: reading.raw,
    });

    await this.processHeartRateAlertService.execute({
      bpm: result.bpm,
      caregiverId,
      elderId: result.elderId,
      measuredAt: result.measuredAt,
    });
  }
}
