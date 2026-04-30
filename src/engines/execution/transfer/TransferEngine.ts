import { TransferValidator } from './TransferValidator'
import { BalanceResolver } from './BalanceResolver'
import { LedgerWriter } from './LedgerWriter'
import { IdempotencyGuard } from './IdempotencyGuard'
import { EscrowRouter } from './EscrowRouter'
import { ExecutionGovernor } from '@/engines/governance/ExecutionGovernorV2'
import { AXPTDigitalTwinEngine } from '@/engines/twin/AXPTDigitalTwinEngine'
import { PredictiveRiskEngine } from '@/engines/risk/PredictiveRiskEngine'
import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'
import { GovernanceCortex } from '@/engines/governance/GovernanceCortex'
import { FinancialConsciousnessLoop } from '@/engines/memory/FinancialConsciousnessLoop'

import type { TransferRequest, TransferResult } from './TransferTypes'

export class TransferEngine {
  constructor(
    private readonly validator = new TransferValidator(),
    private readonly idempotency = new IdempotencyGuard(),
    private readonly balances = new BalanceResolver(),
    private readonly ledger = new LedgerWriter(),
    private readonly escrowRouter = new EscrowRouter(),
    private readonly governor = new ExecutionGovernor(),
    private readonly memory = new MemoryGraphEngine(),
    private readonly risk = new PredictiveRiskEngine(),
    private readonly twin = new AXPTDigitalTwinEngine(
      memory,
      risk,
      new GovernanceCortex(new FinancialConsciousnessLoop())
    )
  ) {}

  async execute(req: TransferRequest): Promise<TransferResult> {
    const executionId = req.idempotencyKey ?? crypto.randomUUID()
    const executionReq = {
      ...req,
      idempotencyKey: executionId,
    }

    /**
     * 1. IDEMPOTENCY
     */
    const existing = await this.idempotency.check(executionReq.idempotencyKey)
    if (existing) return existing

    await this.idempotency.begin(executionReq.idempotencyKey, executionReq)

    try {
      /**
       * 2. VALIDATION
       */
      const ctx = this.validator.validate(executionReq)

      /**
       * 3. BALANCES (READ ONLY)
       */
      const balances = await this.balances.resolve({
        fromUserId: ctx.fromUserId,
        toUserId: ctx.toUserId,
        assetCode: ctx.assetCode,
      })

      if (balances.sender.amountBaseUnits < ctx.amountBaseUnits) {
        throw new Error('INSUFFICIENT_FUNDS')
      }

      /**
       * 4. GOVERNANCE DECISION (NEW SINGLE AUTHORITY)
       */
      const contract = {
        req: {
          idempotencyKey: executionReq.idempotencyKey,
          fromUserId: ctx.fromUserId,
          toUserId: ctx.toUserId,
          assetCode: ctx.assetCode,
          amountBaseUnits: ctx.amountBaseUnits,
          metadata: ctx.metadata,
        },
        ctx: {
          fromUserId: ctx.fromUserId,
          toUserId: ctx.toUserId,
          assetCode: ctx.assetCode,
          amountBaseUnits: ctx.amountBaseUnits,
          escrowId: ctx.metadata?.escrowId,
        },
      }

      const state = await this.memory.exportFinancialState()
      const context = {
        ...state,
        transactions: [...state.transactions, contract.req],
      }
      const [twin, risk] = await Promise.all([
        this.twin.simulate({ transfer: contract.req }),
        this.risk.evaluate({
          userId: ctx.fromUserId,
          amountBaseUnits: ctx.amountBaseUnits,
          assetCode: ctx.assetCode,
        }),
      ])

      const decision = await this.governor.evaluate({
        ...contract,
        twin,
        risk,
      })

      if (decision.decision === 'REJECT') {
        throw new Error(decision.reason || 'TRANSFER_REJECTED')
      }

      /**
       * 5. ESCROW BRANCHING
       */
      let mode: 'TRANSFER' | 'ESCROW' = 'TRANSFER'

      if (decision.decision === 'ESCROW') {
        mode = 'ESCROW'
      }

      /**
       * 6. LEDGER EXECUTION (SOURCE OF TRUTH)
       */
      const result = await this.ledger.execute({
        ...ctx,
        mode,
        transferId: executionReq.idempotencyKey,
      })

      /**
       * 7. FINALIZE IDEMPOTENCY
       */
      await this.idempotency.commit(executionReq.idempotencyKey, result)

      return result
    } catch (err: any) {
      await this.idempotency.fail(executionReq.idempotencyKey, {
        error: err.message,
      })

      throw err
    }
  }
}
