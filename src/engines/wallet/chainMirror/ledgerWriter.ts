// src/engines/wallet/chainMirror/ledgerWriter.ts

export type MirrorDecoded = {
  chainId: number
  tokenType: string
  idempotencyKey: string
  walletEventId: string
  fromAddress: `0x${string}`
  toAddress: `0x${string}`
  amountWei: string
  txHash: string
  logIndex: number
  blockNumber: bigint
  chainTimestamp?: Date | null
}

type LedgerEntryCreateManyInput = {
  chainId: number
  tokenType: string
  walletEventId: string
  idempotencyKey: string
  txHash: string
  logIndex: number
  blockNumber: bigint
  chainTimestamp: Date | null
  accountId: string
  direction: 'DEBIT' | 'CREDIT'
  amount: string
  memo: string
}

export function buildDoubleEntryRows(opts: {
  d: MirrorDecoded
  debitAccountId: string
  creditAccountId: string
}): LedgerEntryCreateManyInput[] {
  const { d, debitAccountId, creditAccountId } = opts

  return [
    {
      chainId: d.chainId,
      tokenType: d.tokenType,
      walletEventId: d.walletEventId,
      idempotencyKey: d.idempotencyKey,
      txHash: d.txHash,
      logIndex: d.logIndex,
      blockNumber: d.blockNumber,
      chainTimestamp: d.chainTimestamp ?? null,
      accountId: debitAccountId,
      direction: 'DEBIT',
      amount: d.amountWei,
      memo: 'MirrorTransfer debit',
    },
    {
      chainId: d.chainId,
      tokenType: d.tokenType,
      walletEventId: d.walletEventId,
      idempotencyKey: d.idempotencyKey,
      txHash: d.txHash,
      logIndex: d.logIndex,
      blockNumber: d.blockNumber,
      chainTimestamp: d.chainTimestamp ?? null,
      accountId: creditAccountId,
      direction: 'CREDIT',
      amount: d.amountWei,
      memo: 'MirrorTransfer credit',
    },
  ]
}
