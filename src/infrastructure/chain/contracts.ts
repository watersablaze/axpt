// src/lib/chain/contracts.ts
import { ethers } from 'ethers';
import { requireAddress } from './addresses';
import protiumTokenAbi from './abis/protiumToken.json';
import chainlinkV3Abi from './abis/chainlinkAggregatorV3.json';

/**
 * Shared read‑only JSON‑RPC provider.
 * Prefers Sepolia unless MAINNET URL is explicitly provided.
 */
const rpcUrl =
  (process.env.SEPOLIA_RPC_URL || '').trim() ||
  (process.env.ETHEREUM_RPC_URL || '').trim() ||
  (process.env.NEXT_PUBLIC_PROVIDER_URL || '').trim() ||
  '';

let _provider: ethers.JsonRpcProvider | undefined;

export function getProvider(): ethers.JsonRpcProvider {
  if (_provider) return _provider;
  if (!rpcUrl) {
    throw new Error(
      'No RPC URL configured. Set SEPOLIA_RPC_URL or ETHEREUM_RPC_URL (or NEXT_PUBLIC_PROVIDER_URL).'
    );
  }
  _provider = new ethers.JsonRpcProvider(rpcUrl);
  return _provider;
}

/** Protium ERC‑20 */
export function getProtiumToken() {
  const addr = requireAddress('token');
  return new ethers.Contract(addr, protiumTokenAbi, getProvider());
}

/**
 * Chainlink AggregatorV3 (USD price feed).
 * Env precedence:
 *  - CHAINLINK_USD_FEED_ADDRESS (recommended)
 *  - ETHUSD_FEED_ADDRESS        (legacy)
 */
function getUsdFeedAddress(): string {
  const raw =
    (process.env.CHAINLINK_USD_FEED_ADDRESS ||
     process.env.CHAINLINK_PRICE_FEED ||
     process.env.ETHUSD_FEED_ADDRESS ||
     '').trim();

  if (!raw) {
    throw new Error(
      'No Chainlink USD feed configured. Set CHAINLINK_USD_FEED_ADDRESS (or CHAINLINK_PRICE_FEED / ETHUSD_FEED_ADDRESS).'
    );
  }
  if (!ethers.isAddress(raw)) throw new Error(`Invalid Chainlink feed address: ${raw}`);
  return raw;
}

export function getUsdPriceFeed() {
  const addr = getUsdFeedAddress();
  return new ethers.Contract(addr, chainlinkV3Abi, getProvider());
}

/**
 * Fetch latest price & metadata from Chainlink AggregatorV3.
 * Returns normalized price as both string & number (for display).
 */
export async function getLatestUsdPrice() {
  const feed = getUsdPriceFeed();

  const [decimals, description, version, data] = await Promise.all([
    feed.decimals() as Promise<number>,
    feed.description() as Promise<string>,
    feed.version() as Promise<bigint>,
    feed.latestRoundData() as Promise<{
      roundId: bigint;
      answer: bigint; // int256 → bigint
      startedAt: bigint;
      updatedAt: bigint;
      answeredInRound: bigint;
    }>,
  ]);

  const priceStr = ethers.formatUnits(data.answer, decimals);
  const price = Number(priceStr); // OK for UI, not for precise on‑chain math

  // ethers v6: contract.address is `.target`
  const feedAddress: string = (feed as any).target ?? (feed as any).address ?? '';

  return {
    feedAddress,
    description,
    version: Number(version),
    decimals,
    roundId: data.roundId.toString(),
    answer: data.answer.toString(),
    priceStr,
    price,
    updatedAt: Number(data.updatedAt),
    startedAt: Number(data.startedAt),
    answeredInRound: data.answeredInRound.toString(),
  };
}