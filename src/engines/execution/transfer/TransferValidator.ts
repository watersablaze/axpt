import { getAsset } from '@/lib/assets/registry'
import { parseDisplayToBaseUnits } from '@/lib/money/baseUnits'

import type {
  TransferRequest,
  TransferExecutionContext,
} from './TransferTypes'

export class TransferValidator {
  /**
   * NORMALIZATION LAYER
   * RAW → CANONICAL EXECUTION CONTEXT
   */
  validate(req: TransferRequest): TransferExecutionContext {
    const {
      fromUserId,
      toUserId,
      amount,
      assetCode,
      feeBps = 0,
      feeMode = 'SENDER_PAYS',
      idempotencyKey,
      note,
      metadata,
    } = req

    if (!fromUserId || !toUserId) throw new Error('INVALID_PARTIES')
    if (fromUserId === toUserId) throw new Error('SELF_TRANSFER_NOT_ALLOWED')

    const asset = getAsset(assetCode)
    if (!asset) throw new Error('UNKNOWN_ASSET')

    const amountDisplay = String(amount).trim()

    const amountBaseUnits = parseDisplayToBaseUnits(
      amountDisplay,
      asset.decimals
    )

    if (amountBaseUnits <= 0n) {
      throw new Error('INVALID_AMOUNT')
    }

    return {
      transferId: idempotencyKey ?? crypto.randomUUID(),

      fromUserId,
      toUserId,

      assetCode: asset.code,
      decimals: asset.decimals,

      amountBaseUnits,

      feeBps,
      feeMode,

      mode: 'TRANSFER',

      idempotencyKey,

      note,
      metadata,
    }
  }
}