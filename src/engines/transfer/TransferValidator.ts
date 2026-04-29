import { getAsset } from '@/lib/assets/registry'
import {
  parseDisplayToBaseUnits,
  bigintToDecimal,
} from '@/lib/money/baseUnits'

import type { TransferRequest } from './TransferTypes'

export type TransferContext = {
  fromUserId: string
  toUserId: string

  assetCode: string
  decimals: number

  amountDisplay: string
  amountBaseUnits: bigint

  feeBps: number
  feeMode: 'SENDER_PAYS' | 'RECEIVER_PAYS'

  idempotencyKey?: string
  source: string

  note?: string
  metadata?: Record<string, any>
}

export class TransferValidator {
  /**
   * CORE NORMALIZATION LAYER
   * Converts raw request → deterministic financial context
   */
  validate(req: TransferRequest): TransferContext {
    const {
      fromUserId,
      toUserId,
      amount,
      assetCode,
      feeBps = 0,
      feeMode = 'SENDER_PAYS',
      idempotencyKey,
      source = 'api',
      note,
      metadata,
    } = req

    if (!fromUserId || !toUserId) {
      throw new Error('INVALID_PARTIES')
    }

    if (fromUserId === toUserId) {
      throw new Error('SELF_TRANSFER_NOT_ALLOWED')
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error('INVALID_AMOUNT')
    }

    const asset = getAsset(assetCode)

    if (!asset) {
      throw new Error('UNKNOWN_ASSET')
    }

    /**
     * STRICT NORMALIZATION
     */
    const amountDisplay = String(amount).trim()

    const amountBaseUnits = parseDisplayToBaseUnits(
      amountDisplay,
      asset.decimals
    )

    if (amountBaseUnits <= 0n) {
      throw new Error('INVALID_BASE_UNITS')
    }

    /**
     * RETURN CANONICAL CONTEXT
     */
    return {
      fromUserId,
      toUserId,

      assetCode: asset.code,
      decimals: asset.decimals,

      amountDisplay,
      amountBaseUnits,

      feeBps,
      feeMode,

      idempotencyKey,
      source,

      note,
      metadata,
    }
  }
}