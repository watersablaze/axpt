import type { PrismaClient } from "@prisma/client";

import {
  readUsdtTransferEvents,
  type UsdtTransferEvent,
} from "@/lib/treasury/transfers";

import {
  persistSettlementObservationWithClient,
  type SettlementObservationPersistenceClient,
} from "./persistSettlementObservationWithClient";

import {
  advanceSettlementObservationCursorWithClient,
  type SettlementObservationCursorAdvanceClient,
} from "./advanceSettlementObservationCursorWithClient";

export type SettlementObservationIngestionClient =
  SettlementObservationPersistenceClient &
  SettlementObservationCursorAdvanceClient;

/*
 * Provider-safe physical RPC window.
 *
 * This does not change the observer's institutional scan range.
 * A logical observer range is partitioned into inclusive windows
 * containing at most 10 blocks before eth_getLogs is invoked.
 */
export const SETTLEMENT_OBSERVER_LOG_WINDOW_BLOCKS =
  10n;

export type SettlementObserverBlockWindow =
  Readonly<{
    fromBlock: bigint;
    toBlock: bigint;
  }>;

export function partitionSettlementObserverBlockRange(
  fromBlock: bigint,
  toBlock: bigint,
): readonly SettlementObserverBlockWindow[] {
  if (fromBlock < 0n) {
    throw new Error(
      `[TREASURY_SETTLEMENT_INGEST_FROM_BLOCK_INVALID] ${fromBlock.toString()}`,
    );
  }

  if (toBlock < fromBlock) {
    throw new Error(
      `[TREASURY_SETTLEMENT_INGEST_RANGE_INVALID] ${fromBlock.toString()} -> ${toBlock.toString()}`,
    );
  }

  const windows:
    SettlementObserverBlockWindow[] = [];

  let cursor =
    fromBlock;

  while (cursor <= toBlock) {
    const windowEnd =
      cursor +
      SETTLEMENT_OBSERVER_LOG_WINDOW_BLOCKS -
      1n;

    const boundedEnd =
      windowEnd < toBlock
        ? windowEnd
        : toBlock;

    windows.push({
      fromBlock:
        cursor,

      toBlock:
        boundedEnd,
    });

    cursor =
      boundedEnd +
      1n;
  }

  return windows;
}

export async function ingestSettlementObservationRangeWithClient(params: {
  client: SettlementObservationIngestionClient;

  watchedAddress: `0x${string}`;

  fromBlock: bigint;
  toBlock: bigint;

  requiredConfirmations: number;

  readTransfers?: typeof readUsdtTransferEvents;
  resolveBlockHash?: (
    blockNumber: bigint,
  ) => Promise<string | null>;
}) {
  const {
    client,
    watchedAddress,
    fromBlock,
    toBlock,
    requiredConfirmations,
  } = params;

  if (toBlock < fromBlock) {
    throw new Error(
      `[TREASURY_SETTLEMENT_INGEST_RANGE_INVALID] ${fromBlock.toString()} -> ${toBlock.toString()}`,
    );
  }

  const readTransfers =
    params.readTransfers ??
    readUsdtTransferEvents;

  const windows =
    partitionSettlementObserverBlockRange(
      fromBlock,
      toBlock,
    );

  const transfers:
    UsdtTransferEvent[] = [];

  /*
   * Read each physical RPC window sequentially.
   *
   * Cursor advancement occurs only after every window succeeds,
   * so a partial provider failure cannot manufacture scan progress.
   */
  for (const window of windows) {
    const windowTransfers =
      await readTransfers({
        address:
          watchedAddress,

        fromBlock:
          window.fromBlock,

        toBlock:
          window.toBlock,
      });

    transfers.push(
      ...windowTransfers,
    );
  }

  const persisted = [];

  for (const transfer of transfers) {
    const observation =
      await persistSettlementObservationWithClient({
        client,
        transfer,
        requiredConfirmations,
      });

    persisted.push(observation);
  }

  let lastScannedBlockHash: string | null = null;

  if (params.resolveBlockHash) {
    lastScannedBlockHash =
      await params.resolveBlockHash(toBlock);
  }

  await advanceSettlementObservationCursorWithClient({
    client,

    chainId: 1,
    network: "mainnet",

    tokenContractAddress:
      "0xdac17f958d2ee523a2206206994597c13d831ec7",

    watchedAddress,

    lastScannedBlock: toBlock,
    lastScannedBlockHash,
  });

  return {
    fromBlock,
    toBlock,
    observed: transfers.length,
    persisted: persisted.length,
  };
}
