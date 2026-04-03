import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PushNotificationModule } from 'src/modules/push-notification/push-notification.module';
import { ElderController } from './elder.controller';
import { PrismaElderRepository } from './elder.repository';
import { ElderService } from './elder.service';

@Module({
  imports: [PrismaModule, PushNotificationModule],
  controllers: [ElderController],
  providers: [
    { provide: 'ElderService', useClass: ElderService },
    { provide: 'ElderRepository', useClass: PrismaElderRepository },
  ],
  exports: ['ElderService'],
})
export class ElderModule {}
