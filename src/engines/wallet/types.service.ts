import type { Currency } from './types';

export type FeeMode = 'SENDER_PAYS' | 'RECIPIENT_PAYS' | 'SPLIT';

export type TransferRequest = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  tokenType: Currency;          // use tokenType when available
  note?: string | null;
  idempotencyKey: string;
  requestId?: string;
  source?: string;              // "api" | "admin" | etc.
  feeBps?: number;              // optional, e.g. 50 = 0.50%
  feeMode?: FeeMode;
};

export type TransferResult = {
  transactionId: string;
  debitEventId: string;
  creditEventId: string;
  feeEventId?: string | null;
  fromNext: number;
  toNext: number;
  feeAmount?: number;
  idempotentReplay: boolean;
  requestId: string;
};