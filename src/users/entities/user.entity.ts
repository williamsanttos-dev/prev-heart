export class UserEntity {
  id: number;
  cpf: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'elder' | 'caregiver';
  createdAt: Date;
  updatedAt: Date;
  elderProfile?: {
    userId: number;
    caregiverId: number | null;
    bpm: number | null;
    deviceId: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  caregiverProfile?: {
    userId: number;
    createdAt: Date;
  } | null;
}
