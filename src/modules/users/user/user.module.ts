import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserMapper } from 'src/shared/mappers/user.mapper';
import { CaregiverModule } from '../caregiver/caregiver.module';
import { ElderModule } from '../elder/elder.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaUserRepository } from './user.repository';

@Module({
  imports: [PrismaModule, ElderModule, CaregiverModule],
  controllers: [UserController],
  providers: [
    UserMapper,
    { provide: 'UsersService', useClass: UserService },
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
})
export class UserModule {}
