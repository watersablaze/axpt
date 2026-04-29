import { TransferValidator } from './TransferValidator'
import { BalanceResolver } from './BalanceResolver'
import { LedgerWriter } from './LedgerWriter'
import { IdempotencyGuard } from './IdempotencyGuard'
import { EscrowRouter } from './EscrowRouter'
import { EscrowEngine } from '../escrow/EscrowEngine'
import { RiskFirewall } from '../risk/RiskFirewall'

import type { TransferRequest, TransferResult } from './TransferTypes'

export class TransferEngine {
  constructor(
    private readonly validator = new TransferValidator(),
    private readonly idempotency = new IdempotencyGuard(),
    private readonly balances = new BalanceResolver(),
    private readonly ledger = new LedgerWriter(),
    private readonly escrowRouter = new EscrowRouter(),
    private readonly escrowEngine = new EscrowEngine()
  ) {}

  async execute(req: TransferRequest): Promise<TransferResult> {
    const existing = await this.idempotency.check(req.idempotencyKey)
    if (existing) return existing

    await this.idempotency.begin(req.idempotencyKey, req)

    try {
      const ctx = this.validator.validate(req)

      const balances = await this.balances.resolve({
        fromUserId: ctx.fromUserId,
        toUserId: ctx.toUserId,
        assetCode: ctx.assetCode,
      })

      if (balances.sender.amountBaseUnits < ctx.amountBaseUnits) {
        throw new Error('INSUFFICIENT_FUNDS')
      }

      let mode = this.escrowRouter.route(ctx, req.metadata)

      /**
       * ──────────────────────────────
       * RISK FIREWALL GATE (NEW LAYER)
       * ──────────────────────────────
       */
      if (mode === 'ESCROW' || mode === 'TRANSFER') {
        const firewall = new RiskFirewall()

        const decision = await firewall.evaluate({
          userId: ctx.fromUserId,
          amountBaseUnits: ctx.amountBaseUnits,
          assetCode: ctx.assetCode,
        })

        if (decision.action === 'BLOCK') {
          throw new Error(`TRANSFER_BLOCKED: ${decision.reason}`)
        }

        if (decision.action === 'ESCROW_FORCE') {
          mode = 'ESCROW'
          req.metadata = {
            ...req.metadata,
            forcedMode: 'ESCROW',
            reason: decision.reason,
          }
        }
      }

      /**
       * ──────────────────────────────
       * ESCROW INITIATION
       * ──────────────────────────────
       */
      if (mode === 'ESCROW') {
        const escrow = await this.escrowEngine.initiate({
          caseId: req.metadata?.caseId,
          fromUserId: ctx.fromUserId,
          toUserId: ctx.toUserId,
          assetCode: ctx.assetCode,
          amountBaseUnits: ctx.amountBaseUnits,
        })

        await this.escrowEngine.transition({
          escrowId: escrow.id,
          next: 'FUNDS_LOCKED',
          actor: 'TRANSFER_ENGINE',
        })

        ctx.escrowId = escrow.id
      }

      /**
       * ──────────────────────────────
       * LEDGER EXECUTION
       * ──────────────────────────────
       */
      const result = await this.ledger.execute({
        context: {
          ...ctx,
          mode,
          transferId:
            req.idempotencyKey ?? crypto.randomUUID(),
        },
        balances,
        mode,
      })

      await this.idempotency.commit(req.idempotencyKey, result)

      return result
    } catch (err: any) {
      await this.idempotency.fail(req.idempotencyKey, {
        error: err.message,
      })

      throw err
    }
  }
}