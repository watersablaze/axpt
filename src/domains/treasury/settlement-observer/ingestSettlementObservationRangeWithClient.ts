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

  const transfers =
    await readTransfers({
      address: watchedAddress,
      fromBlock,
      toBlock,
    });

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
