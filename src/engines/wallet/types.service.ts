import type { AssetCode } from '@/lib/assets/registry';
import type { TransferContext } from '@/domains/wallet/types/transferContext'

export type FeeMode = 'SENDER_PAYS' | 'RECIPIENT_PAYS' | 'SPLIT';

export type TransferRequest = {
  fromUserId: string
  toUserId: string
  amount: string
  assetCode: AssetCode
  note?: string | null
  metadata?: Record<string, unknown>
  roles?: string[]
  idempotencyKey: string
  requestId?: string
  source?: string
  feeBps?: number
  feeMode?: 'SENDER_PAYS' | 'RECIPIENT_PAYS' | 'SPLIT'
  context?: TransferContext
};

export type TransferResult = {
  transactionId: string;
  debitEventId: string;
  creditEventId: string;
  feeEventId?: string | null;
  assetCode: AssetCode;
  fromNext: string;
  toNext: string;
  feeAmount?: string;
  fromNextBaseUnits: string;
  toNextBaseUnits: string;
  feeBaseUnits?: string;
  idempotentReplay: boolean;
  requestId: string;
};
