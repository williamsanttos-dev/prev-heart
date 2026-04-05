import { Injectable } from '@nestjs/common';

import {
  GetLatestHeartRateInput,
  HeartRateProvider,
  HeartRateReading,
} from '../interfaces/heart-rate-provider.interface';

@Injectable()
export class MockHeartRateProvider implements HeartRateProvider {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getLatestByElder(
    input: GetLatestHeartRateInput,
  ): Promise<HeartRateReading | null> {
    if (input.elderId === 3) throw new Error('Mock provider integration error');

    if (input.elderId === 1)
      return this.buildReading({
        value: 78,
        source: 'mock',
        deviceId: input.deviceId,
        externalReadingId: `mock-normal-${input.elderId}-${Date.now()}`,
      });

    if (input.elderId === 2)
      return this.buildReading({
        value: 128,
        source: 'mock',
        deviceId: input.deviceId,
        externalReadingId: `mock-critical-${input.elderId}-${Date.now()}`,
      });

    const bpmRandom = Math.floor(Math.random() * (130 - 105 + 1)) + 105; // 105 .. 130
    return this.buildReading({
      value: bpmRandom,
      source: 'mock',
      deviceId: input.deviceId,
      externalReadingId: `mock-default-${input.elderId}-${Date.now()}`,
    });
  }

  private buildReading(params: {
    value: number;
    source: 'mock';
    externalReadingId: string;
    deviceId?: string;
  }): HeartRateReading {
    return {
      value: params.value,
      measuredAt: new Date(),
      source: params.source,
      externalReadingId: params.externalReadingId,
      deviceId: params.deviceId,
      raw: {
        provider: 'mock',
        simulated: true,
        bpm: params.value,
      },
    };
  }
}
