import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { DeviceIdResponseDTO } from '../dto/device-id-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { ElderService } from '../elder/elder.service';
import type { ICaregiverService } from '../caregiver/interfaces/caregiver.service.interface';
import type { IUserService } from './interfaces/user.service.interface';

@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    @Inject('UsersService')
    private readonly userService: IUserService,
    private readonly elderService: ElderService,
    @Inject('CaregiverService')
    private readonly caregiverService: ICaregiverService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'user returned with successfully',
    type: UserEntity,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserEntity> {
    return await this.userService.getProfile(req.user);
  }

  @Patch()
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return await this.userService.update(req.user, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  @ApiNoContentResponse({ description: 'No Content' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.userService.remove(req.user);
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
    if (req.user.role === 'elder') {
      return await this.elderService.getDevice(req.user);
    }

    if (req.user.role === 'caregiver') {
      return await this.caregiverService.getDevice(req.user);
    }

    throw new UnauthorizedException();
  }
}
