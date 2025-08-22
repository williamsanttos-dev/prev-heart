export class ElderEntity {
  elder: {
    userId: number;
    createdAt: Date;
    caregiverId: number | null;
    deviceId: string | null;
    bpm: number | null;
    updatedAt: Date;
  } | null;
}
