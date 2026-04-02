import { Module } from '@nestjs/common';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { CaregiverModule } from '../caregiver/caregiver.module';
import { ElderModule } from '../elder/elder.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ElderModule, CaregiverModule],
  controllers: [UserController],
  providers: [UserService, UserMapper],
})
export class UserModule {}
