import { walletClient, publicClient } from "./axptViemClient"
import { parseAbi } from "viem"

export const axgEscrowAbi = parseAbi([
  "function lockEscrow(bytes32 caseId, address from, address to, uint256 amount) external",
  "function releaseEscrow(bytes32 caseId) external",
  "function disputeEscrow(bytes32 caseId) external",
  "function escrows(bytes32 caseId) external view returns (address from, address to, uint256 amount, uint8 status, uint256 timestamp)",
  "event EscrowLocked(bytes32 caseId, address from, address to, uint256 amount)",
  "event EscrowReleased(bytes32 caseId)",
  "event EscrowDisputed(bytes32 caseId)"
])

export const axgEscrowAddress =
  (process.env.AXG_ESCROW_ADDRESS || process.env.AXG_ESCROW_CONTRACT) as `0x${string}`

/**
 * 🔒 LOCK ON-CHAIN ESCROW
 */
export async function lockOnChainEscrow(params: {
  caseId: string
  from: `0x${string}`
  to: `0x${string}`
  amount: bigint
}) {
  return walletClient.writeContract({
    address: axgEscrowAddress,
    abi: axgEscrowAbi,
    functionName: "lockEscrow",
    args: [
      params.caseId as `0x${string}`,
      params.from,
      params.to,
      params.amount,
    ],
  })
}

/**
 * 🔓 RELEASE ON-CHAIN ESCROW
 */
export async function releaseOnChainEscrow(caseId: string) {
  return walletClient.writeContract({
    address: axgEscrowAddress,
    abi: axgEscrowAbi,
    functionName: "releaseEscrow",
    args: [caseId as `0x${string}`],
  })
}

/**
 * 📡 READ ESCROW STATE
 */
export async function getEscrowState(caseId: string) {
  return publicClient.readContract({
    address: axgEscrowAddress,
    abi: axgEscrowAbi,
    functionName: "escrows",
    args: [caseId as `0x${string}`],
  })
}
