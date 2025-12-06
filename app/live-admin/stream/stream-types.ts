export interface StreamStatus {
  online: boolean;
  startedAt?: string | null;
  uptimeSeconds?: number;
  viewerCount?: number;
  bitrateKbps?: number;
  droppedFrames?: number;
  fps?: number;
  resolution?: string;
  lastDisconnected?: string | null;
  error?: string | null;
}