import { Module } from '@nestjs/common';
import { PushNotificationModule } from 'src/push-notification/push-notification.module';
import { ElderController } from './elder.controller';
import { ElderService } from './elder.service';

@Module({
  imports: [PushNotificationModule],
  controllers: [ElderController],
  providers: [ElderService],
  exports: [ElderService],
})
export class ElderModule {}
