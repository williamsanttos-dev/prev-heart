import {
  Controller,
  Post,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Inject,
} from '@nestjs/common';
import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { IPushNotificationService } from './interfaces/push-notification.service.interface';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/push-notification')
export class PushNotificationController {
  constructor(
    @Inject('PushNotificationService')
    private readonly pushNotificationService: IPushNotificationService,
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
