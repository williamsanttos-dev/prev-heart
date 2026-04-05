export type GetLatestHeartRateInput = {
  elderId: number;
  externalPatientId?: string;
  deviceId: string;
};

export type HeartRateReading = {
  value: number;
  measuredAt: Date;
  source: 'watch_api' | 'mobile_app' | 'mock';
  externalReadingId?: string;
  deviceId?: string;
  raw?: any;
};

export interface HeartRateProvider {
  getLatestByElder(
    input: GetLatestHeartRateInput,
  ): Promise<HeartRateReading | null>;
}
