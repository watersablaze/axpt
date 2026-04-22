import { formatUnits } from "viem"
import { publicClient } from "./clients"
import { TOKENS } from "./config"
import { erc20TransferAbi } from "./erc20TransferAbi"

const USDT = TOKENS.USDT

export type TransferRecord = {
  txHash: string
  from: string
  to: string
  amount: string
  direction: "in" | "out"
}

export async function getUsdtTransfers(address: `0x${string}`) {
  const currentBlock = await publicClient.getBlockNumber()

  const fromBlock = currentBlock - 10_000n

  const logs = await publicClient.getLogs({
    address: USDT.address,
    event: erc20TransferAbi[0],
    fromBlock,
    toBlock: currentBlock,
  })

  const filtered = logs.filter(
    (log) =>
      log.args.from?.toLowerCase() === address.toLowerCase() ||
      log.args.to?.toLowerCase() === address.toLowerCase()
  )

  const transfers: TransferRecord[] = filtered.map((log) => {
    const from = log.args.from!
    const to = log.args.to!
    const raw = log.args.value!

    const direction =
      to.toLowerCase() === address.toLowerCase() ? "in" : "out"

    return {
      txHash: log.transactionHash,
      from,
      to,
      amount: formatUnits(raw as bigint, USDT.decimals),
      direction,
    }
  })

  return transfers.reverse().slice(0, 20)
}