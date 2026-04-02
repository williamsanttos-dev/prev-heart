import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CaregiverController } from './caregiver.controller';
import { PrismaCaregiverRepository } from './caregiver.repository';
import { CaregiverService } from './caregiver.service';

@Module({
  imports: [PrismaModule],
  controllers: [CaregiverController],
  providers: [
    { provide: 'CaregiverService', useClass: CaregiverService },
    { provide: 'CaregiverRepository', useClass: PrismaCaregiverRepository },
  ],
  exports: ['CaregiverService'],
})
export class CaregiverModule {}
