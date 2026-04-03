import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { UserEntity } from '../../entities/user.entity';
import { UpdateUserDto } from './../dto/update-user.dto';

export interface IUserRepository {
  getProfile(payload: JwtPayloadDTO): Promise<UserEntity | null>;
  update(
    payload: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity>;
  remove(payload: JwtPayloadDTO): Promise<void>;
}
