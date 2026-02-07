export type NommoPhase =
  | 'DORMANT'
  | 'INITIATION'
  | 'LIVE'
  | 'AFTERGLOW'
  | 'ERROR';

export type NommoSignal =
  | { type: 'REQUEST_LIVE_START' }
  | { type: 'REQUEST_LIVE_STOP' }
  | { type: 'STREAM_CONFIRMED_LIVE' }
  | { type: 'STREAM_CONFIRMED_OFFLINE' }
  | { type: 'INGEST_ERROR' }
  | { type: 'MANUAL_OVERRIDE'; phase: NommoPhase };