import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CaregiverProfileResponse } from '../dto/caregiver-profile.dto';
import { HeartBeatResponseDTO } from '../dto/heart-beat.dto';
import { DeviceIdResponseDTO } from '../../user/dto/device-id-response.dto';
import { DeviceIdDTO } from '../../user/dto/device-id.dto';

export type ElderBpmResult = HeartBeatResponseDTO & {
  caregiverId: number | null;
  elderName: string;
};

export type ElderData = {
  userId: number;
  deviceId: string | null;
};

export interface IElderRepository {
  findAll(): Promise<ElderData[]>;
  // sendBPM(
  //   payload: JwtPayloadDTO,
  //   heartBeatDto: HeartBeatDTO,
  // ): Promise<ElderBpmResult | null>;
  registerDevice(
    payload: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO | null>;
  getCaregiverLinked(
    payload: JwtPayloadDTO,
  ): Promise<CaregiverProfileResponse | null>;
  getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO | null>;
  deleteDevice(payload: JwtPayloadDTO): Promise<void>;
}
