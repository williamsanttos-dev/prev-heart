import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { PushTokenModule } from './push-token/push-token.module';

@Module({
  controllers: [],
  providers: [],
  imports: [AuthModule, PrismaModule, UsersModule, PushTokenModule],
})
export class AppModule {}
