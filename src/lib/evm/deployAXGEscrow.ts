import { walletClient, publicClient } from "./axptViemClient"
import AXGEscrowAbi from "@/contracts/abi/AXGEscrow.json"

const bytecode = "0x..." // we will plug compiled bytecode here

export async function deployAXGEscrow() {
  const hash = await walletClient.deployContract({
    abi: AXGEscrowAbi,
    bytecode,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  console.log("🚀 AXGEscrow deployed:", receipt.contractAddress)

  return receipt.contractAddress
}
