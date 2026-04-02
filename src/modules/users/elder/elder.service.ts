import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { PushNotificationService } from 'src/modules/push-notification/push-notification.service';
import { CaregiverProfileResponse } from './dto/caregiver-profile.dto';
import { HeartBeatDTO, HeartBeatResponseDTO } from './dto/heart-beat.dto';
import { DeviceIdResponseDTO } from '../user/dto/device-id-response.dto';
import { DeviceIdDTO } from '../user/dto/device-id.dto';
import type { IElderRepository } from './interfaces/elder.repository.interface';
import type { IElderService } from './interfaces/elder.service.interface';

@Injectable()
export class ElderService implements IElderService {
  constructor(
    @Inject('ElderRepository')
    private readonly elderRepository: IElderRepository,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async sendBPM(
    payload: JwtPayloadDTO,
    heartBeatDto: HeartBeatDTO,
  ): Promise<HeartBeatResponseDTO> {
    const limit = 120;
    const elder = await this.elderRepository.sendBPM(payload, heartBeatDto);

    if (!elder) throw new InternalServerErrorException();

    if (heartBeatDto.bpm > limit && elder.caregiverId) {
      await this.pushNotificationService.send(
        elder.caregiverId,
        elder.elderName,
        elder.bpm,
      );
    }

    return { bpm: elder.bpm, updatedAt: elder.updatedAt };
  }

  async registerDevice(
    payload: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO> {
    const user = await this.elderRepository.registerDevice(payload, deviceId);

    if (!user) throw new InternalServerErrorException();

    return user;
  }

  async getCaregiverLinked(
    payload: JwtPayloadDTO,
  ): Promise<CaregiverProfileResponse> {
    const caregiver = await this.elderRepository.getCaregiverLinked(payload);

    if (!caregiver) {
      throw new NotFoundException(
        'The elderly person does not have a caregiver assigned to them.',
      );
    }

    return caregiver;
  }

  async getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO> {
    const deviceId = await this.elderRepository.getDevice(payload);

    if (!deviceId) throw new NotFoundException();

    return deviceId;
  }

  async deleteDevice(payload: JwtPayloadDTO): Promise<void> {
    await this.elderRepository.deleteDevice(payload);
  }
}
