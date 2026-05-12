import { publicClient } from '../client'
import { AXGEscrowABI } from '../abis/AXGEscrowABI'

export function listenEscrowEvents(callback: (event: any) => void) {
  return publicClient.watchContractEvent({
    address: process.env.AXG_ESCROW_ADDRESS as `0x${string}`,
    abi: AXGEscrowABI,
    eventName: 'EscrowLocked',
    onLogs: (logs) => {
      logs.forEach(callback)
    },
  })
}
