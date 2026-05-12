import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"
import { runtimeBus } from "@/engines/runtime/serverSingletons"

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_PROVIDER_URL!),
})

type EscrowChainEvent = {
  escrowId: string
  txHash: string
  from: string
  to: string
  amount: string
  blockNumber: bigint
}

export class EscrowChainListener {
  private lastBlock: bigint = 0n

  /**
   * 🔁 POLL OR SUBSCRIBE (simplified first version)
   */
  async start() {
    setInterval(() => this.scan(), 5000)
  }

  private async scan() {
    const latest = await client.getBlockNumber()

    const logs = await client.getLogs({
      fromBlock: this.lastBlock,
      toBlock: latest,
      event: {
        type: "event",
        name: "EscrowExecuted",
        inputs: [
          { name: "escrowId", type: "string" },
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
      },
    })

    for (const log of logs) {
      const event: EscrowChainEvent = {
        escrowId: (log as any).args.escrowId,
        txHash: log.transactionHash!,
        from: (log as any).args.from,
        to: (log as any).args.to,
        amount: (log as any).args.amount.toString(),
        blockNumber: log.blockNumber!,
      }

      runtimeBus.emit({
        type: "CHAIN_ESCROW_CONFIRMED",
        ...event,
        timestamp: Date.now(),
      })
    }

    this.lastBlock = latest
  }
}

export const escrowChainListener = new EscrowChainListener()