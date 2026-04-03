import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CreatePushNotificationDto } from '../dto/create-push-notification.dto';

export interface IPushNotificationService {
  create(
    payloadJwt: JwtPayloadDTO,
    createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void>;
  send(caregiverId: number, name: string, bpm: number): Promise<void>;
  remove(payloadJwt: JwtPayloadDTO): Promise<void>;
}
