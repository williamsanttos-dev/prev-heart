import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CaregiverProfileResponse } from '../../dto/caregiver-profile.dto';
import { DeviceIdResponseDTO } from '../../dto/device-id-response.dto';
import { DeviceIdDTO } from '../../dto/device-id.dto';
import { HeartBeatDTO, HeartBeatResponseDTO } from '../../dto/heart-beat.dto';

export type ElderBpmResult = HeartBeatResponseDTO & {
  caregiverId: number | null;
  elderName: string;
};

export interface IElderRepository {
  sendBPM(
    payload: JwtPayloadDTO,
    heartBeatDto: HeartBeatDTO,
  ): Promise<ElderBpmResult | null>;
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
