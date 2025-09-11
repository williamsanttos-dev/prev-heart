import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { PushTokenModule } from 'src/push-token/push-token.module';

@Module({
  imports: [PushTokenModule],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  // exports: [UserMapper],
})
export class UsersModule {}
