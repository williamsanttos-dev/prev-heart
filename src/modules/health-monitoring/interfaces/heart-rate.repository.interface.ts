export type SaveHeartRateReadingInput = {
  elderId: number;
  bpm: number;
  measuredAt: Date;
  source: 'watch_api' | 'mobile_app' | 'mock';
  externalReadingId?: string;
  rawPayload?: unknown;
};

export type HeartRateRecord = {
  id: number;
  elderId: number;
  bpm: number;
  measuredAt: Date;
  source: string;
  externalReadingId?: string | null;
  createdAt: Date;
};

export type HeartRateData = {
  elderId: number;
  bpm: number;
  measuredAt: Date;
};

export interface HeartRateRepository {
  save(input: SaveHeartRateReadingInput): Promise<HeartRateData>;
  findLatestByElderId(elderId: number): Promise<HeartRateRecord | null>;
}
