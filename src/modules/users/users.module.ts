import { Module } from '@nestjs/common';
import { CaregiverModule } from './caregiver/caregiver.module';
import { ElderModule } from './elder/elder.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, ElderModule, CaregiverModule],
})
export class UsersModule {}
