import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserEntity } from '../../entities/user.entity';

export interface IUserService {
  getProfile(payload: JwtPayloadDTO): Promise<UserEntity>;
  update(
    payload: JwtPayloadDTO,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity>;
  remove(payload: JwtPayloadDTO): Promise<void>;
}
