import {
  formatUnits,
  getAddress,
  type Address,
  type Hash,
} from "viem";

import { getPublicClient } from "./clients";
import { TOKENS } from "./config";
import { erc20TransferAbi } from "./erc20TransferAbi";

const ETHEREUM_MAINNET_CHAIN_ID = 1;
const ETHEREUM_MAINNET_NETWORK = "mainnet" as const;

const USDT = TOKENS.USDT;

export type UsdtTransferEvent = Readonly<{
  chainId: typeof ETHEREUM_MAINNET_CHAIN_ID;
  network: typeof ETHEREUM_MAINNET_NETWORK;

  tokenContractAddress: Address;

  txHash: Hash;
  logIndex: number;

  blockNumber: bigint;
  blockHash: Hash | null;

  from: Address;
  to: Address;

  amountBaseUnits: bigint;
  amount: string;

  direction: "in" | "out";
}>;

export type ReadUsdtTransferEventsInput = Readonly<{
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
}>;

export async function readUsdtTransferEvents(
  input: ReadUsdtTransferEventsInput,
): Promise<readonly UsdtTransferEvent[]> {
  const {
    address,
    fromBlock,
    toBlock,
  } = input;

  if (fromBlock < 0n) {
    throw new Error(
      `[TREASURY_USDT_READER_FROM_BLOCK_INVALID] ${fromBlock.toString()}`,
    );
  }

  if (toBlock < fromBlock) {
    throw new Error(
      `[TREASURY_USDT_READER_BLOCK_RANGE_INVALID] ${fromBlock.toString()} -> ${toBlock.toString()}`,
    );
  }

  const publicClient = getPublicClient();

  const normalizedAddress = getAddress(address);

  const logs = await publicClient.getLogs({
    address: USDT.address,
    event: erc20TransferAbi[0],
    fromBlock,
    toBlock,
  });

  const transfers: UsdtTransferEvent[] = [];

  for (const log of logs) {
    const from = log.args.from;
    const to = log.args.to;
    const value = log.args.value;

    if (
      !from ||
      !to ||
      value === undefined ||
      log.transactionHash === null ||
      log.blockNumber === null
    ) {
      continue;
    }

    const normalizedFrom = getAddress(from);
    const normalizedTo = getAddress(to);

    const isInbound =
      normalizedTo === normalizedAddress;

    const isOutbound =
      normalizedFrom === normalizedAddress;

    if (!isInbound && !isOutbound) {
      continue;
    }

    transfers.push({
      chainId: ETHEREUM_MAINNET_CHAIN_ID,
      network: ETHEREUM_MAINNET_NETWORK,

      tokenContractAddress: USDT.address,

      txHash: log.transactionHash,
      logIndex: Number(log.logIndex),

      blockNumber: log.blockNumber,
      blockHash: log.blockHash,

      from: normalizedFrom,
      to: normalizedTo,

      amountBaseUnits: value,
      amount: formatUnits(
        value,
        USDT.decimals,
      ),

      direction: isInbound
        ? "in"
        : "out",
    });
  }

  return transfers;
}

/**
 * Legacy Treasury Pulse compatibility record.
 *
 * This intentionally exposes the existing narrow shape while the
 * canonical settlement observer consumes readUsdtTransferEvents().
 */
export type TransferRecord = Readonly<{
  txHash: string;
  from: string;
  to: string;
  amount: string;
  direction: "in" | "out";
}>;

/**
 * Legacy recent-transfer helper used by Treasury Pulse.
 *
 * Do not use this function as a canonical settlement observation boundary.
 */
export async function getUsdtTransfers(
  address: Address,
): Promise<readonly TransferRecord[]> {
  const publicClient = getPublicClient();

  const currentBlock =
    await publicClient.getBlockNumber();

  const lookback = 10_000n;

  const fromBlock =
    currentBlock > lookback
      ? currentBlock - lookback
      : 0n;

  const transfers =
    await readUsdtTransferEvents({
      address,
      fromBlock,
      toBlock: currentBlock,
    });

  return [...transfers]
    .reverse()
    .slice(0, 20)
    .map((transfer) => ({
      txHash: transfer.txHash,
      from: transfer.from,
      to: transfer.to,
      amount: transfer.amount,
      direction: transfer.direction,
    }));
}
