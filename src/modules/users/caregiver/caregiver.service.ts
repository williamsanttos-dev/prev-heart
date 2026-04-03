import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { ElderProfileResponse } from './dto/elder-profile.dto';
import { DeviceIdResponseDTO } from '../user/dto/device-id-response.dto';
import { DeviceIdDTO } from '../user/dto/device-id.dto';
import type { ICaregiverRepository } from './interfaces/caregiver.repository.interface';
import type { ICaregiverService } from './interfaces/caregiver.service.interface';

@Injectable()
export class CaregiverService implements ICaregiverService {
  constructor(
    @Inject('CaregiverRepository')
    private readonly caregiverRepository: ICaregiverRepository,
  ) {}

  async createElderLink(
    payload: JwtPayloadDTO,
    deviceIdDto: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO> {
    try {
      const result = await this.caregiverRepository.createElderLink(
        payload,
        deviceIdDto,
      );

      if (!result) {
        throw new NotFoundException('The device has not yet been registered.');
      }

      if ('conflict' in (result as object)) {
        throw new ConflictException(
          'The elderly person linked to the device already has a caregiver. First, you need to unlink the device from the elderly person in order to link another one.',
        );
      }

      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw error;
    }
  }

  async deleteElderLink(payload: JwtPayloadDTO): Promise<void> {
    await this.caregiverRepository.deleteElderLink(payload);
  }

  async getElderLinked(payload: JwtPayloadDTO): Promise<ElderProfileResponse> {
    const elder = await this.caregiverRepository.getElderLinked(payload);

    if (!elder?.name || !elder?.phone || !elder?.deviceId) {
      throw new NotFoundException({
        message: 'The caregiver does not have a elder assigned to them.',
        body: {
          name: null,
          phone: null,
          deviceId: null,
          bpm: null,
        },
      });
    }

    if (elder.bpm === null || elder.bpm === undefined) {
      throw new InternalServerErrorException();
    }

    return elder;
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO> {
    const deviceId = await this.caregiverRepository.getDevice(payload);

    if (!deviceId) throw new NotFoundException();

    return deviceId;
  }
}
