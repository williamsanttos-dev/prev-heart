import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './entities/user.entity';

import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';
import { DeviceIdDTO } from './dto/device-id.dto';
import { ElderEntity } from './entities/elder.entity';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserEntity> {
    return await this.usersService.getProfile(req.user);
  }

  @Patch()
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return await this.usersService.update(req.user, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.usersService.remove(req.user);
  }

  @Patch('bpm')
  async sendBPM(
    @Req() req: AuthenticatedRequest,
    @Body() heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.sendBPM(req.user, heartBeatDto);
  }

  @Patch('device')
  async registerDevice(
    @Req() req: AuthenticatedRequest,
    @Body() deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.registerDevice(req.user, deviceId);
  }

  @Patch('link')
  async createElderLink(
    @Req() req: AuthenticatedRequest,
    @Body() deviceId: DeviceIdDTO,
  ) {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    return await this.usersService.createElderLink(req.user, deviceId);
  }

  @Get('elder')
  async getElderProfileLinked(
    @Req() req: AuthenticatedRequest,
  ): Promise<ElderEntity> {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    return await this.usersService.getElderProfileLinked(req.user);
  }
}
