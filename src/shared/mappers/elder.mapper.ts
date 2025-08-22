import { Injectable } from '@nestjs/common';
import { ElderProfile, CaregiverProfile } from '@prisma/client';
import { ElderEntity } from 'src/users/entities/elder.entity';

type CaregiverProfileWithElder = CaregiverProfile & {
  elder: ElderProfile | null;
};

@Injectable()
export class ElderMapper {
  toEntityFromPrisma(
    caregiverWithElder: CaregiverProfileWithElder | null,
  ): ElderEntity {
    return {
      elder: caregiverWithElder?.elder
        ? {
            userId: caregiverWithElder.elder.userId,
            caregiverId: caregiverWithElder.elder.caregiverId,
            deviceId: caregiverWithElder.elder.deviceId,
            createdAt: caregiverWithElder.elder.createdAt,
            updatedAt: caregiverWithElder.elder.updatedAt,
            bpm: caregiverWithElder.elder.bpm,
          }
        : null,
    };
  }
}
