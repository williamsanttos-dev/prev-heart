import { Module } from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { PushTokenController } from './push-token.controller';

@Module({
  controllers: [PushTokenController],
  providers: [PushTokenService],
  exports: [PushTokenService],
})
export class PushTokenModule {}
