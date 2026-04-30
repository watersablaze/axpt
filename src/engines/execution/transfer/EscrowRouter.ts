import type { TransferExecutionContext } from './TransferTypes'

export class EscrowRouter {
  route(ctx: TransferExecutionContext, metadata?: any): 'TRANSFER' | 'ESCROW' {
    if (metadata?.caseId) {
      return 'ESCROW'
    }

    if (ctx.feeBps > 500) {
      return 'ESCROW'
    }

    return 'TRANSFER'
  }
}
