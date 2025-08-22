import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { ElderMapper } from 'src/shared/mappers/elder.mapper';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserMapper, ElderMapper],
  // exports: [UserMapper],
})
export class UsersModule {}
