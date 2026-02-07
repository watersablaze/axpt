export type ChainMirrorStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'FAILED';

export type ChainNetwork = 'ethereum' | 'polygon' | 'testnet';

export interface ChainSubmissionResult {
  txHash: string;
  network: ChainNetwork;
}