import { Matches } from 'class-validator';

export class DeviceIdDTO {
  @Matches(/^[A-Za-z0-9]{8}$/, {
    message:
      'The device ID must be valid. It must contain only letters and numbers, and the length must be 8. ',
  })
  deviceId: string;
}
