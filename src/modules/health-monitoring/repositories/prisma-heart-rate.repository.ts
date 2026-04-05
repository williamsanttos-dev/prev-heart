import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  HeartRateRecord,
  HeartRateRepository,
  SaveHeartRateReadingInput,
} from '../interfaces/heart-rate.repository.interface';

@Injectable()
export class PrismaHeartRateRepository implements HeartRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(input: SaveHeartRateReadingInput): Promise<void> {
    await this.prisma.heartRateMeasurement.create({
      data: {
        elderId: input.elderId,
        bpm: input.bpm,
        measuredAt: input.measuredAt,
        source: input.source,
        externalReadingId: input.externalReadingId,
        rawPayload: input.rawPayload as any, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      },
    });
  }

  async findLatestByElderId(elderId: number): Promise<HeartRateRecord | null> {
    const measurement = await this.prisma.heartRateMeasurement.findFirst({
      where: {
        elderId,
      },
      orderBy: {
        measuredAt: 'desc',
      },
      select: {
        id: true,
        elderId: true,
        bpm: true,
        measuredAt: true,
        source: true,
        externalReadingId: true,
        createdAt: true,
      },
    });

    if (!measurement) return null;

    return measurement;
  }
}
