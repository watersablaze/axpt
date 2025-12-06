export interface LiveStatus {
  online: boolean;
  viewerCount: number;
  thumbnailUrl?: string;
  ingest?: {
    bitrate: number;
    health: string;
  };
  meta?: {
    streamTitle?: string;
    startedAt?: string;
  };
}