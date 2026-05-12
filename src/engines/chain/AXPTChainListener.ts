import { publicClient } from "@/lib/evm/axptViemClient"
import { axgEscrowAbi, axgEscrowAddress } from "@/lib/evm/contracts/axgEscrow"
import { eventIngestionEngine } from "@/engines/events/AXPTEventIngestionEngine"
import { circuitBreakerEngine } from "@/engines/safety/AXPTCircuitBreakerEngine"

export class AXPTChainListener {
  private running = false

  start() {
    if (this.running) return
    this.running = true
    this.watchEscrowEvents()
  }

  private watchEscrowEvents() {

    publicClient.watchContractEvent({
      address: axgEscrowAddress,
      abi: axgEscrowAbi,
      eventName: "EscrowLocked",

      onLogs: (logs) => {
        logs.forEach((log) => {
          eventIngestionEngine.ingest({
            log,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        })

        circuitBreakerEngine.evaluate({
          drift: 0,
          failedExecutions: 0,
          chainDesync: false,
        })
      },
    })

    publicClient.watchContractEvent({
      address: axgEscrowAddress,
      abi: axgEscrowAbi,
      eventName: "EscrowReleased",

      onLogs: (logs) => {
        logs.forEach((log) => {
          eventIngestionEngine.ingest({
            log,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        })
      },
    })
  }
}

export const chainListener = new AXPTChainListener()
