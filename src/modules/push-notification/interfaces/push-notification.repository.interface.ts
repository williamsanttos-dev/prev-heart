import { JwtPayloadDTO } from 'src/auth/dto/Jwt-payload';
import { CreatePushNotificationDto } from '../dto/create-push-notification.dto';

export type PushTokenRecord = {
  id: number;
  userId: number;
  token: string;
  createdAt: Date;
  lastSentAt: Date | null;
};

export interface IPushNotificationRepository {
  create(
    payloadJwt: JwtPayloadDTO,
    createPushNotificationDto: CreatePushNotificationDto,
  ): Promise<void>;
  findByUserId(userId: number): Promise<PushTokenRecord | null>;
  update(token: string): Promise<void>;
  reserveTokenForSend(
    caregiverId: number,
    now: Date,
    timeGapInSeconds: number,
  ): Promise<string | null>;
  remove(payloadJwt: JwtPayloadDTO): Promise<void>;
}
