import { Module } from '@nestjs/common';
import { PushTokenModule } from 'src/push-token/push-token.module';
import { ElderController } from './elder.controller';
import { ElderService } from './elder.service';

@Module({
  imports: [PushTokenModule],
  controllers: [ElderController],
  providers: [ElderService],
  exports: [ElderService],
})
export class ElderModule {}
