import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

/**
 * 🔗 AXG BLOCKCHAIN CLIENT (VIEM)
 */
export class AXGBlockchainClient {
  private publicClient
  private walletClient

  constructor(private privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey)

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    })

    this.walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    })
  }

  /**
   * 💸 WRITE TRANSACTION
   */
  async writeContract(params: {
    address: `0x${string}`
    abi: any
    functionName: string
    args: any[]
    value?: bigint
  }) {
    const hash = await this.walletClient.writeContract({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
      value: params.value ?? 0n,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
    })

    return {
      txHash: hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    }
  }
}