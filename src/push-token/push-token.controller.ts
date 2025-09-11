import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@UseGuards(AuthGuard)
@Controller('api/push-notification')
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createPushTokenDto: CreatePushTokenDto,
  ) {
    await this.pushTokenService.create(req.user, createPushTokenDto);
  }

  @Get()
  findAll() {
    return this.pushTokenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pushTokenService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePushTokenDto: UpdatePushTokenDto,
  ) {
    return this.pushTokenService.update(+id, updatePushTokenDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    return await this.pushTokenService.remove(req.user);
  }
}
