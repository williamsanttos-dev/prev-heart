import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({
    status: 200,
    description: 'id, name, role and access token returned',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        id: {
          type: 'number',
          example: 1,
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
        role: {
          type: 'string',
          enum: ['admin', 'elder', 'caregiver'],
          example: 'elder',
        },
      },
    },
  })
  async login(@Body() loginUserDTO: LoginUserDTO) {
    return await this.authService.login(loginUserDTO);
  }
}
