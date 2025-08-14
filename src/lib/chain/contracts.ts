import { ethers } from 'ethers';
import protiumTokenAbi from './abis/protiumToken.json';
import chainlinkV3Abi from './abis/chainlinkAggregatorV3.json';

/**
 * Shared JSON-RPC provider (read-only).
 * Prefers SEPOLIA for safety unless you explicitly set a mainnet URL.
 */
const rpcUrl =
  process.env.SEPOLIA_RPC_URL ||
  process.env.ETHEREUM_RPC_URL ||
  process.env.NEXT_PUBLIC_PROVIDER_URL ||
  '';
if (!rpcUrl) {
  // Don't crash on import; throw when actually used.
  // eslint-disable-next-line no-console
  console.warn('[chain/contracts] No RPC URL set. Set SEPOLIA_RPC_URL or ETHEREUM_RPC_URL.');
}
const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : undefined;

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) throw new Error('No RPC URL configured (SEPOLIA_RPC_URL / ETHEREUM_RPC_URL)');
  return provider;
}

/**
 * Protium ERC-20
 */
const tokenAddress = (process.env.PROTIUM_TOKEN_ADDRESS || '').trim();
export function getProtiumToken() {
  if (!tokenAddress) throw new Error('PROTIUM_TOKEN_ADDRESS is not set in env');
  return new ethers.Contract(tokenAddress, protiumTokenAbi, getProvider());
}

/**
 * Chainlink AggregatorV3 (USD price feed).
 * You can wire any USD feed address here (e.g., ETH/USD on Sepolia or Mainnet).
 *
 * Env precedence:
 * - CHAINLINK_USD_FEED_ADDRESS (recommended generic)
 * - ETHUSD_FEED_ADDRESS (legacy/explicit ETH-USD)
 */
function getUsdFeedAddress(): string {
  const addr =
    (process.env.CHAINLINK_USD_FEED_ADDRESS || process.env.ETHUSD_FEED_ADDRESS || '').trim();
  if (!addr) {
    throw new Error(
      'No Chainlink USD feed configured. Set CHAINLINK_USD_FEED_ADDRESS or ETHUSD_FEED_ADDRESS.'
    );
  }
  if (!ethers.isAddress(addr)) {
    throw new Error(`Invalid Chainlink feed address: ${addr}`);
  }
  return addr;
}

export function getUsdPriceFeed() {
  const addr = getUsdFeedAddress();
  return new ethers.Contract(addr, chainlinkV3Abi, getProvider());
}

/**
 * Fetch latest price & metadata from Chainlink AggregatorV3.
 * Returns normalized price as a JS number (be mindful of precision needs).
 */
export async function getLatestUsdPrice() {
  const feed = getUsdPriceFeed();
  const [decimals, description, version, round] = await Promise.all([
    feed.decimals() as Promise<number>,
    feed.description() as Promise<string>,
    feed.version() as Promise<bigint>,
    feed.latestRoundData() as Promise<{
      roundId: bigint;
      answer: bigint; // int256 in ABI, ethers maps to bigint
      startedAt: bigint;
      updatedAt: bigint;
      answeredInRound: bigint;
    }>
  ]);

  // Chainlink returns 'answer' scaled by `decimals`.
  // Use formatUnits for safe conversion to string, then Number if acceptable.
  const priceStr = ethers.formatUnits(round.answer, decimals);
  const price = Number(priceStr); // for display; avoid for high-precision math

  return {
    feedAddress: feed.target as string, // ethers v6
    description,
    version: Number(version),
    decimals,
    roundId: round.roundId.toString(),
    answer: round.answer.toString(), // raw
    price, // normalized as number (e.g., 3245.67)
    priceStr, // normalized as string to avoid precision loss
    updatedAt: Number(round.updatedAt), // unix seconds
    startedAt: Number(round.startedAt),
    answeredInRound: round.answeredInRound.toString()
  };
}