import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PushTokenModule } from './push-token/push-token.module';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, PushTokenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
