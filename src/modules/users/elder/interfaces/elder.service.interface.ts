import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CaregiverProfileResponse } from '../dto/caregiver-profile.dto';
import { DeviceIdResponseDTO } from '../../user/dto/device-id-response.dto';
import { DeviceIdDTO } from '../../user/dto/device-id.dto';

export interface IElderService {
  // sendBPM(
  //   payload: JwtPayloadDTO,
  //   heartBeatDto: HeartBeatDTO,
  // ): Promise<HeartBeatResponseDTO>;
  registerDevice(
    payload: JwtPayloadDTO,
    deviceId: DeviceIdDTO,
  ): Promise<DeviceIdDTO>;
  getCaregiverLinked(payload: JwtPayloadDTO): Promise<CaregiverProfileResponse>;
  getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO>;
  deleteDevice(payload: JwtPayloadDTO): Promise<void>;
}
