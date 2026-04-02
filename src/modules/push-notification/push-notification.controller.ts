import {
  Controller,
  Post,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/push-notification')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  @ApiOkResponse({
    description: 'Expo Push Token storaged with successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void> {
    await this.pushNotificationService.create(
      req.user,
      createPushNotificationDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    return await this.pushNotificationService.remove(req.user);
  }
}
