import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import type { IUserRepository } from './interfaces/user.repository.interface';
import type { IUserService } from './interfaces/user.service.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async getProfile(payload: JwtPayloadDTO): Promise<UserEntity> {
    const user = await this.userRepository.getProfile(payload);

    if (!user) throw new InternalServerErrorException();

    return user;
  }

  async update(
    payload: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return await this.userRepository.update(payload, updateUserDto);
  }

  async remove(payload: JwtPayloadDTO): Promise<void> {
    await this.userRepository.remove(payload);
  }
}
