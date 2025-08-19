export class UserEntity {
  id: number;
  cpf: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'elder' | 'caregiver';
  birthDate: Date;
  createdAt: Date;
  updatedAt: Date;
  elderProfile?: {
    userId: number;
    createdAt: Date;
    caregiverId: number | null;
    bpm: number | null;
  } | null;
  caregiverProfile?: {
    userId: number;
    createdAt: Date;
  } | null;
}
