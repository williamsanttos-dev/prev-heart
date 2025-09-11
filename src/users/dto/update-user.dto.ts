import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../auth/dto/create-user.dto';

export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'phone'] as const),
) {}
