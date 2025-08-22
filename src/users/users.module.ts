import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserMapper } from 'src/shared/mappers/user.mapper';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  // exports: [UserMapper],
})
export class UsersModule {}
