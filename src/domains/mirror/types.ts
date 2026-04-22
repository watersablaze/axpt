export type ChainMirrorStatus =
  | 'PENDING'
  | 'CLAIMED'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'RETRYABLE'
  | 'FAILED';

export type ChainNetwork = 'ethereum' | 'polygon' | 'testnet';

export interface ChainSubmissionResult {
  txHash: string;
  network: ChainNetwork;
}
