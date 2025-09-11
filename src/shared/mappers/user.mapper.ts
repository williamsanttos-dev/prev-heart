import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserEntity } from 'src/users/entities/user.entity';

type PrismaUserWithProfiles = Prisma.UserGetPayload<{
  include: {
    elderProfile: true;
    caregiverProfile: true;
  };
}>;

@Injectable()
export class UserMapper {
  toEntityFromPrisma(user: PrismaUserWithProfiles): UserEntity {
    return {
      id: user.id,
      cpf: user.cpf,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role as UserEntity['role'],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      elderProfile: user.elderProfile
        ? {
            userId: user.elderProfile.userId,
            caregiverId: user.elderProfile.caregiverId,
            deviceId: user.elderProfile.deviceId,
            createdAt: user.elderProfile.createdAt,
            updatedAt: user.elderProfile.updatedAt,
            bpm: user.elderProfile.bpm,
          }
        : null,
      caregiverProfile: user.caregiverProfile
        ? {
            userId: user.caregiverProfile.userId,
            createdAt: user.caregiverProfile.createdAt,
          }
        : null,
    };
  }
}
