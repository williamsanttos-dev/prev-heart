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

  @Patch('send-bpm')
  async sendBPM(
    @Req() req: AuthenticatedRequest,
    @Body() heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    if (req.user.role !== 'elder') throw new UnauthorizedException();

    return await this.usersService.sendBPM(req.user, heartBeatDto);
  }
}
