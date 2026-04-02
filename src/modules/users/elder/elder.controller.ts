import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { AuthGuard } from 'src/auth/auth.guard';
import { CaregiverProfileResponse } from '../dto/caregiver-profile.dto';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { HeartBeatDTO, HeartBeatResponseDTO } from '../dto/heart-beat.dto';
import { ElderService } from './elder.service';

@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class ElderController {
  constructor(private readonly elderService: ElderService) {}

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

    return await this.elderService.sendBPM(req.user, heartBeatDto);
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

    return await this.elderService.registerDevice(req.user, deviceId);
  }

  @Get('caregiver')
  @ApiOkResponse({
    description: 'Caregiver profile returned with successfully',
    type: CaregiverProfileResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async getCaregiverLinked(
    @Req() req: AuthenticatedRequest,
  ): Promise<CaregiverProfileResponse> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.elderService.getCaregiverLinked(req.user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @Delete('device')
  async deleteDevice(@Req() req: AuthenticatedRequest): Promise<void> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    await this.elderService.deleteDevice(req.user);
  }
}
