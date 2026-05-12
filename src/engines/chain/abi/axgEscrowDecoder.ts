import { decodeEventLog } from "viem"
import { axgEscrowAbi } from "@/lib/evm/contracts/axgEscrow"

/**
 * 🔗 AXG ESCROW ABI DECODER
 */
export function decodeAxgEscrowEvent(log: any) {
  return decodeEventLog({
    abi: axgEscrowAbi,
    data: log.data,
    topics: log.topics,
  })
}