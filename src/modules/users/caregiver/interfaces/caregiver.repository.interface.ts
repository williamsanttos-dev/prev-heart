import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { DeviceIdResponseDTO } from '../../dto/device-id-response.dto';
import { DeviceIdDTO } from '../../dto/device-id.dto';
import { ElderProfileResponse } from '../../dto/elder-profile.dto';

export interface ICaregiverRepository {
  createElderLink(
    payload: JwtPayloadDTO,
    deviceIdDto: DeviceIdDTO,
  ): Promise<DeviceIdResponseDTO | null>;
  deleteElderLink(payload: JwtPayloadDTO): Promise<void>;
  getElderLinked(payload: JwtPayloadDTO): Promise<ElderProfileResponse>;
  getDevice(payload: JwtPayloadDTO): Promise<DeviceIdResponseDTO | null>;
}
