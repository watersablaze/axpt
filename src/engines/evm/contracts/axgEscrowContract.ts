import { AXGEscrowABI } from '../abis/AXGEscrowABI'
import { publicClient, walletClient } from '../client'
import type { AbiEvent } from 'viem'

const CONTRACT_ADDRESS = process.env.AXG_ESCROW_ADDRESS as `0x${string}`

export class AXGEscrowContract {

  /**
   * 🔐 CREATE ESCROW
   */
  async createEscrow(params: {
    caseId: `0x${string}`
    from: `0x${string}`
    to: `0x${string}`
    amount: bigint
  }) {
    return walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: AXGEscrowABI,
      functionName: 'lockEscrow',
      args: [params.caseId, params.from, params.to, params.amount],
    })
  }

  /**
   * 🔓 RELEASE ESCROW
   */
  async releaseEscrow(escrowId: `0x${string}`) {
    return walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: AXGEscrowABI,
      functionName: 'releaseEscrow',
      args: [escrowId],
    })
  }

  /**
   * 🔁 REFUND ESCROW
   */
  async refundEscrow(escrowId: `0x${string}`) {
    return walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: AXGEscrowABI,
      functionName: 'disputeEscrow',
      args: [escrowId],
    })
  }

  /**
   * 👁️ READ EVENT HISTORY
   */
  async getEscrowEvents(fromBlock: bigint) {
    const event = AXGEscrowABI.find((entry) => entry.type === 'event' && entry.name === 'EscrowLocked') as AbiEvent

    return publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event,
      fromBlock,
    })
  }
}

export const axgEscrowContract = new AXGEscrowContract()
