import { createResidentWallet } from '@/domains/wallet/createResidentWallet';
import { transferToken } from '@/engines/wallet/service';

type TransferParams = {
  fromUserId: string;
  toUserId: string;
  amount: string;
  note?: string;
};

/**
 * Resident -> Resident AXG transfer on custodial ledger.
 * - Ensures both wallets/balances exist (auto-births recipient if needed)
 * - Checks sufficient funds
 * - Atomically debits sender and credits recipient
 * - Writes two Transaction rows (debit + credit) with counterparty metadata
 */
export async function transferAxg({ fromUserId, toUserId, amount, note }: TransferParams) {
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer to self.');
  }

  // Ensure recipient has a wallet/balances before routing through the canonical wallet service.
  await createResidentWallet(toUserId);

  return transferToken({
    fromUserId,
    toUserId,
    amount,
    assetCode: 'AXG',
    note,
    idempotencyKey: `transfer-axg:${fromUserId}:${toUserId}:${String(amount)}:${note ?? ''}`,
    source: 'domain.transferAxg',
  });
}
