export type NotifyHighHeartRateInput = {
  elderId: number;
  elderName: string;
  caregiverId: number;
  bpm: number;
  measuredAt: Date;
  threshold: number;
};

export interface AlertNotifier {
  notifyHighHeartRate(input: NotifyHighHeartRateInput): Promise<void>;
}
