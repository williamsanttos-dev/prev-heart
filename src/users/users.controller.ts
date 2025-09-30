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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNoContentResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserEntity } from './entities/user.entity';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';
import { DeviceIdDTO } from './dto/device-id.dto';
import { DeviceIdResponseDTO } from './dto/device-id-response.dto';
import { ElderProfileResponse } from './dto/elder-profile.dto';
import { CaregiverProfileResponse } from './dto/caregiver-profile.dto';

@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({
    description: 'user returned with successfully',
    type: UserEntity,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
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
  @ApiNoContentResponse({ description: 'No Content' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.usersService.remove(req.user);
  }

  @Patch('bpm')
  @ApiOkResponse({
    description: 'bpm updated with successfully',
    type: HeartBeatResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async sendBPM(
    @Req() req: AuthenticatedRequest,
    @Body() heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.sendBPM(req.user, heartBeatDto);
  }

  @Patch('device')
  @ApiOkResponse({
    description: 'Device registered with successfully',
    type: DeviceIdDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async registerDevice(
    @Req() req: AuthenticatedRequest,
    @Body() deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.registerDevice(req.user, deviceId);
  }

  @Patch('link')
  @ApiOkResponse({
    description: 'Link created with successfully',
    type: DeviceIdResponseDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiConflictResponse({
    description: 'Conflict',
  })
  async createElderLink(
    @Req() req: AuthenticatedRequest,
    @Body() deviceId: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO> {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    return await this.usersService.createElderLink(req.user, deviceId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('unlink')
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async deleteElderLink(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    return await this.usersService.deleteElderLink(req.user);
  }

  @Get('elder')
  @ApiOkResponse({
    description: 'Elder profile returned with successfully',
    type: ElderProfileResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  async getElderLinked(
    @Req() req: AuthenticatedRequest,
  ): Promise<ElderProfileResponse> {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    return await this.usersService.getElderLinked(req.user);
  }

  @Get('caregiver')
  @ApiOkResponse({
    description: 'Caregiver profile returned with successfully',
    type: CaregiverProfileResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async getCaregiverLinked(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.getCaregiverLinked(req.user);
  }

  @Get('device')
  @ApiOkResponse({
    description: 'Device Id returned with successfully',
    type: DeviceIdResponseDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async getDevice(
    @Req() req: AuthenticatedRequest,
  ): Promise<DeviceIdResponseDTO> {
    if (req.user.role !== 'elder' && req.user.role !== 'caregiver')
      throw new UnauthorizedException();

    return await this.usersService.getDevice(req.user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @Delete('device')
  async deleteDevice(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.deleteDevice(req.user);
  }
}
