import { ExecutionIntent } from '@/engines/core/types/ExecutionIntent'
import { AXGEscrowABI } from './abi/AXGEscrowABI'
import { AXGBlockchainClient } from './AXGBlockchainClient'

/**
 * 🔐 REAL AXG ESCROW ADAPTER (VIEM POWERED)
 */
export class AXGEscrowAdapter {
  constructor(
    private client: AXGBlockchainClient,
    private escrowContract: `0x${string}`
  ) {}

  /**
   * 🧾 CREATE ESCROW (ON-CHAIN REAL CALL)
   */
  async createEscrow(intent: ExecutionIntent) {
    const escrowId = this.generateEscrowId(intent)

    const result = await this.client.writeContract({
      address: this.escrowContract,
      abi: AXGEscrowABI,
      functionName: 'lockEscrow',
      args: [
        escrowId,
        intent.fromUserId as `0x${string}`,
        intent.toUserId as `0x${string}`,
        intent.amountBaseUnits,
      ],
    })

    return {
      escrowId,
      ...result,
    }
  }

  /**
   * 🔓 RELEASE ESCROW
   */
  async releaseEscrow(escrowId: `0x${string}`) {
    return this.client.writeContract({
      address: this.escrowContract,
      abi: AXGEscrowABI,
      functionName: 'releaseEscrow',
      args: [escrowId],
    })
  }

  /**
   * 🔁 REFUND ESCROW
   */
  async refundEscrow(escrowId: `0x${string}`) {
    return this.client.writeContract({
      address: this.escrowContract,
      abi: AXGEscrowABI,
      functionName: 'disputeEscrow',
      args: [escrowId],
    })
  }

  /**
   * 🧠 DETERMINISTIC ID GENERATION
   */
  private generateEscrowId(intent: ExecutionIntent): `0x${string}` {
    const raw = `${intent.fromUserId}-${intent.toUserId}-${intent.amountBaseUnits}`

    const hex = Buffer.from(raw).toString('hex').padEnd(64, '0')

    return `0x${hex.slice(0, 64)}` as `0x${string}`
  }
}
