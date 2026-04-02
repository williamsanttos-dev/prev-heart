import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { PushNotificationModule } from './modules/push-notification/push-notification.module';

@Module({
  controllers: [],
  providers: [],
  imports: [AuthModule, PrismaModule, UsersModule, PushNotificationModule],
})
export class AppModule {}
