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
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { AuthGuard } from 'src/auth/auth.guard';
import { DeviceIdResponseDTO } from '../dto/device-id-response.dto';
import { DeviceIdDTO } from '../dto/device-id.dto';
import { ElderProfileResponse } from '../dto/elder-profile.dto';
import { CaregiverService } from './caregiver.service';

@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService) {}

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

    return await this.caregiverService.createElderLink(req.user, deviceId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('unlink')
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async deleteElderLink(@Req() req: AuthenticatedRequest): Promise<void> {
    if (req.user.role !== 'caregiver') throw new UnauthorizedException();

    await this.caregiverService.deleteElderLink(req.user);
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

    return await this.caregiverService.getElderLinked(req.user);
  }
}
