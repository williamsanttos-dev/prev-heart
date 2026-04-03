import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CreatePushNotificationDto } from '../dto/create-push-notification.dto';

export interface IPushNotificationRepository {
  create(
    payloadJwt: JwtPayloadDTO,
    createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void>;
  reserveTokenForSend(
    caregiverId: number,
    now: Date,
    timeGapInSeconds: number,
  ): Promise<string | null>;
  remove(payloadJwt: JwtPayloadDTO): Promise<void>;
}
