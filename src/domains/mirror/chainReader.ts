import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'

const rpcUrl = process.env.SEPOLIA_RPC_URL
const mirrorBridgeAddress = process.env.EVM_MIRROR_BRIDGE_ADDRESS as
  | `0x${string}`
  | undefined

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl)
})

const MIRROR_TRANSFER_EVENT = parseAbiItem(
  'event MirrorTransfer(bytes32 idempotencyKey, bytes32 walletEventId, bytes32 tokenType, address from, address to, uint256 amount)'
)

export async function getMirrorEvents(
  fromBlock?: bigint,
  toBlock?: bigint
) {
  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL missing')
  }

  if (!mirrorBridgeAddress) {
    throw new Error('EVM_MIRROR_BRIDGE_ADDRESS missing')
  }

  return publicClient.getLogs({
    address: mirrorBridgeAddress,
    event: MIRROR_TRANSFER_EVENT,
    fromBlock: fromBlock ?? 0n,
    toBlock: toBlock ?? 'latest'
  })
}