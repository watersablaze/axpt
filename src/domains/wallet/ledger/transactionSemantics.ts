import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

export type MovementType =
  | 'EXTERNAL_IN'
  | 'EXTERNAL_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ESCROW_LOCK'
  | 'ESCROW_RELEASE'
  | 'ADJUSTMENT'

/**
 * Raw ledger entry → semantic financial meaning
 */
export function inferMovementType(tx: {
  type: keyof typeof TRANSACTION_TYPES
  fromWalletId?: string | null
  toWalletId?: string | null
  metadata?: Record<string, any>
}): MovementType {
  const { type, fromWalletId, toWalletId, metadata } = tx

  switch (type) {
    case 'CREDIT':
      if (fromWalletId) return 'TRANSFER_IN'
      return 'EXTERNAL_IN'

    case 'DEBIT':
      if (toWalletId) return 'TRANSFER_OUT'
      return 'EXTERNAL_OUT'

    case 'FEE':
      return 'ADJUSTMENT'

    case 'TREASURY':
      return 'ADJUSTMENT'

    case 'ADJUSTMENT':
      return 'ADJUSTMENT'

    default:
      throw new Error(`Unknown transaction type: ${type}`)
  }
}

/**
 * Determines if transaction participates in value movement
 */
export function isValueMovement(tx: {
  type: keyof typeof TRANSACTION_TYPES
}) {
  return tx.type === 'CREDIT' || tx.type === 'DEBIT'
}

/**
 * Determines if transaction is reversible (important for dispute logic)
 */
export function isReversible(tx: {
  type: keyof typeof TRANSACTION_TYPES
}) {
  return tx.type === 'CREDIT' || tx.type === 'DEBIT'
}