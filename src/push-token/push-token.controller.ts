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
import { PushTokenService } from './push-token.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';
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
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

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
    @Body() createPushTokenDto: CreatePushTokenDto,
  ): Promise<void> {
    await this.pushTokenService.create(req.user, createPushTokenDto);
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
    return await this.pushTokenService.remove(req.user);
  }
}
