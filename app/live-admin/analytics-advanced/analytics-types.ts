export interface StreamSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  peakViewers: number;
  averageViewers: number;
  durationSeconds: number;
}

export interface Demographics {
  countries: Record<string, number>;
}