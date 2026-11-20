import {
  getPublicClient,
} from "@/lib/treasury/clients";

import {
  readUsdtTransferEvents,
} from "@/lib/treasury/transfers";

import {
  readSettlementObservationChainState,
} from "./readSettlementObservationChainState";

import {
  TOKENS,
  TREASURY_WALLETS,
} from "@/lib/treasury/config";

import {
  loadSettlementObservationCursorWithClient,
  type SettlementObservationCursorClient,
} from "./loadSettlementObservationCursorWithClient";

import {
  ingestSettlementObservationRangeWithClient,
  type SettlementObservationIngestionClient,
} from "./ingestSettlementObservationRangeWithClient";

import {
  validateSettlementObservationWithClient,
  type SettlementObservationValidationClient,
} from "./validateSettlementObservationWithClient";

import {
  ETHEREUM_MAINNET_SETTLEMENT_POLICY,
} from "./finalityPolicy";

const ETHEREUM_MAINNET_CHAIN_ID =
  ETHEREUM_MAINNET_SETTLEMENT_POLICY.chainId;

const ETHEREUM_MAINNET_NETWORK =
  ETHEREUM_MAINNET_SETTLEMENT_POLICY.network;

const REQUIRED_CONFIRMATIONS =
  ETHEREUM_MAINNET_SETTLEMENT_POLICY.minimumConfirmations;

const DEFAULT_MAX_NEW_BLOCKS_PER_CYCLE =
  25n;

const MAX_ALLOWED_NEW_BLOCKS_PER_CYCLE =
  100n;

const REORG_OVERLAP_BLOCKS =
  12n;

const DEFAULT_VALIDATION_BATCH_SIZE =
  100;

const MAX_VALIDATION_BATCH_SIZE =
  500;

const USDT_CONTRACT =
  TOKENS.USDT.address.toLowerCase();

function requireOperationsWallet():
  `0x${string}` {
  const wallet =
    TREASURY_WALLETS.find(
      (candidate) =>
        candidate.role ===
        "operations",
    );

  if (!wallet) {
    throw new Error(
      "[TREASURY_SETTLEMENT_OBSERVER_OPERATIONS_WALLET_MISSING]",
    );
  }

  return wallet.address;
}

const OPERATIONS_WALLET =
  requireOperationsWallet();

const WATCHED_ADDRESS =
  OPERATIONS_WALLET.toLowerCase();

export type SettlementObserverCycleClient =
  SettlementObservationCursorClient &
  SettlementObservationIngestionClient &
  SettlementObservationValidationClient;

export type SettlementObserverCycleDisposition =
  | "BOOTSTRAP_REQUIRED"
  | "IDLE"
  | "ADVANCED";

export type SettlementObserverCycleResult =
  Readonly<{
    disposition:
      SettlementObserverCycleDisposition;

    chainId:
      typeof ETHEREUM_MAINNET_CHAIN_ID;

    network:
      typeof ETHEREUM_MAINNET_NETWORK;

    watchedAddress:
      string;

    tokenContractAddress:
      string;

    headBlock:
      bigint;

    cursorBefore:
      bigint | null;

    scannedFrom:
      bigint | null;

    scannedTo:
      bigint | null;

    cursorAfter:
      bigint | null;

    observed:
      number;

    persisted:
      number;

    validationCandidates:
      number;

    validated:
      number;

    chainUnavailable:
      number;
  }>;

function requireBoundedPositiveBigInt(
  value: bigint,
  name: string,
  maximum: bigint,
): bigint {
  if (
    value <= 0n ||
    value > maximum
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVER_${name}_INVALID] ${value.toString()}`,
    );
  }

  return value;
}

function requireBoundedPositiveInteger(
  value: number,
  name: string,
  maximum: number,
): number {
  if (
    !Number.isInteger(value) ||
    value <= 0 ||
    value > maximum
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVER_${name}_INVALID] ${value}`,
    );
  }

  return value;
}

function maxBigInt(
  a: bigint,
  b: bigint,
): bigint {
  return a > b
    ? a
    : b;
}

function minBigInt(
  a: bigint,
  b: bigint,
): bigint {
  return a < b
    ? a
    : b;
}

export async function runSettlementObserverCycleWithClient(
  params: {
    client:
      SettlementObserverCycleClient;

    /**
     * Required only until the durable cursor exists.
     *
     * There is deliberately no implicit historical lookback.
     * Initial chain authority must be explicitly selected.
     */
    bootstrapFromBlock?: bigint;

    maxNewBlocksPerCycle?: bigint;

    validationBatchSize?: number;

    readChainId?: () => Promise<number>;

    readHeadBlock?: () => Promise<bigint>;

    resolveBlockHash?: (
      blockNumber: bigint,
    ) => Promise<string | null>;

    readTransfers?: typeof readUsdtTransferEvents;

    readChainState?:
      typeof readSettlementObservationChainState;
  },
): Promise<SettlementObserverCycleResult> {
  const {
    client,
  } = params;

  const maxNewBlocksPerCycle =
    requireBoundedPositiveBigInt(
      params.maxNewBlocksPerCycle ??
        DEFAULT_MAX_NEW_BLOCKS_PER_CYCLE,
      "MAX_NEW_BLOCKS",
      MAX_ALLOWED_NEW_BLOCKS_PER_CYCLE,
    );

  const validationBatchSize =
    requireBoundedPositiveInteger(
      params.validationBatchSize ??
        DEFAULT_VALIDATION_BATCH_SIZE,
      "VALIDATION_BATCH_SIZE",
      MAX_VALIDATION_BATCH_SIZE,
    );

  const readChainId =
    params.readChainId ??
    (() =>
      getPublicClient()
        .getChainId());

  const chainId =
    await readChainId();

  if (
    chainId !==
    ETHEREUM_MAINNET_CHAIN_ID
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVER_CHAIN_INVALID] expected=${ETHEREUM_MAINNET_CHAIN_ID} actual=${chainId}`,
    );
  }

  const readHeadBlock =
    params.readHeadBlock ??
    (() =>
      getPublicClient()
        .getBlockNumber());

  const resolveBlockHash =
    params.resolveBlockHash ??
    (async (
      blockNumber: bigint,
    ) => {
      const block =
        await getPublicClient()
          .getBlock({
            blockNumber,
          });

      return (
        block.hash?.toLowerCase() ??
        null
      );
    });

  const headBlock =
    await readHeadBlock();

  const cursor =
    await loadSettlementObservationCursorWithClient({
      client,

      chainId:
        ETHEREUM_MAINNET_CHAIN_ID,

      tokenContractAddress:
        USDT_CONTRACT,

      watchedAddress:
        WATCHED_ADDRESS,
    });

  const cursorBefore =
    cursor?.lastScannedBlock ??
    null;

  if (
    !cursor &&
    params.bootstrapFromBlock ===
      undefined
  ) {
    return {
      disposition:
        "BOOTSTRAP_REQUIRED",

      chainId:
        ETHEREUM_MAINNET_CHAIN_ID,

      network:
        ETHEREUM_MAINNET_NETWORK,

      watchedAddress:
        WATCHED_ADDRESS,

      tokenContractAddress:
        USDT_CONTRACT,

      headBlock,

      cursorBefore:
        null,

      scannedFrom:
        null,

      scannedTo:
        null,

      cursorAfter:
        null,

      observed:
        0,

      persisted:
        0,

      validationCandidates:
        0,

      validated:
        0,

      chainUnavailable:
        0,
    };
  }

  const bootstrapFromBlock =
    params.bootstrapFromBlock;

  if (
    bootstrapFromBlock !==
      undefined &&
    bootstrapFromBlock < 0n
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVER_BOOTSTRAP_BLOCK_INVALID] ${bootstrapFromBlock.toString()}`,
    );
  }

  let scannedFrom:
    bigint | null = null;

  let scannedTo:
    bigint | null = null;

  let observed = 0;
  let persisted = 0;

  /*
   * When no cursor exists, the explicit bootstrap block is the
   * institutional ingress boundary.
   *
   * Once a cursor exists, poll forward in bounded increments.
   * A small overlap is deliberately rescanned whenever there are
   * new blocks so replacement logs inside the recent reorg window
   * can be admitted idempotently.
   */
  if (!cursor) {
    const fromBlock =
      bootstrapFromBlock!;

    if (
      fromBlock <= headBlock
    ) {
      const toBlock =
        minBigInt(
          headBlock,
          fromBlock +
            maxNewBlocksPerCycle -
            1n,
        );

      const ingestion =
        await ingestSettlementObservationRangeWithClient({
          client,

          watchedAddress:
            OPERATIONS_WALLET,

          fromBlock,
          toBlock,

          requiredConfirmations:
            REQUIRED_CONFIRMATIONS,

          resolveBlockHash,

          readTransfers:
            params.readTransfers,
        });

      scannedFrom =
        ingestion.fromBlock;

      scannedTo =
        ingestion.toBlock;

      observed =
        ingestion.observed;

      persisted =
        ingestion.persisted;
    }
  } else if (
    headBlock >
    cursor.lastScannedBlock
  ) {
    const nextForwardBlock =
      cursor.lastScannedBlock +
      1n;

    const overlapFloor =
      maxBigInt(
        0n,
        cursor.lastScannedBlock -
          REORG_OVERLAP_BLOCKS +
          1n,
      );

    const fromBlock =
      overlapFloor;

    const toBlock =
      minBigInt(
        headBlock,
        nextForwardBlock +
          maxNewBlocksPerCycle -
          1n,
      );

    const ingestion =
      await ingestSettlementObservationRangeWithClient({
        client,

        watchedAddress:
          OPERATIONS_WALLET,

        fromBlock,
        toBlock,

        requiredConfirmations:
          REQUIRED_CONFIRMATIONS,

        resolveBlockHash,

        readTransfers:
          params.readTransfers,
      });

    scannedFrom =
      ingestion.fromBlock;

    scannedTo =
      ingestion.toBlock;

    observed =
      ingestion.observed;

    persisted =
      ingestion.persisted;
  }

  /*
   * Validation is deliberately separate from ingestion.
   *
   * An observed log becomes durable chain evidence first.
   * Receipt/finality classification then advances its evidence
   * state. No DSI recognition happens here.
   */
  const candidates =
    await client
      .treasurySettlementObservation
      .findMany({
        where: {
          chainId:
            ETHEREUM_MAINNET_CHAIN_ID,

          network:
            ETHEREUM_MAINNET_NETWORK,

          tokenContractAddress:
            USDT_CONTRACT,

          toAddress:
            WATCHED_ADDRESS,

          status: {
            in: [
              "DETECTED",
              "VALIDATED",
              "CONFIRMING",
            ],
          },
        },

        orderBy: [
          {
            blockNumber:
              "asc",
          },
          {
            logIndex:
              "asc",
          },
        ],

        take:
          validationBatchSize,

        select: {
          id: true,
        },
      });

  let validated = 0;
  let chainUnavailable = 0;

  for (
    const candidate
    of candidates
  ) {
    const result =
      await validateSettlementObservationWithClient({
        client,

        observationId:
          candidate.id,

        readChainState:
          params.readChainState,
      });

    if (
      result.disposition ===
      "CHAIN_UNAVAILABLE"
    ) {
      chainUnavailable +=
        1;

      continue;
    }

    validated += 1;
  }

  const cursorAfterRecord =
    await loadSettlementObservationCursorWithClient({
      client,

      chainId:
        ETHEREUM_MAINNET_CHAIN_ID,

      tokenContractAddress:
        USDT_CONTRACT,

      watchedAddress:
        WATCHED_ADDRESS,
    });

  const cursorAfter =
    cursorAfterRecord
      ?.lastScannedBlock ??
    null;

  const disposition:
    SettlementObserverCycleDisposition =
    scannedTo !== null
      ? "ADVANCED"
      : "IDLE";

  return {
    disposition,

    chainId:
      ETHEREUM_MAINNET_CHAIN_ID,

    network:
      ETHEREUM_MAINNET_NETWORK,

    watchedAddress:
      WATCHED_ADDRESS,

    tokenContractAddress:
      USDT_CONTRACT,

    headBlock,

    cursorBefore,

    scannedFrom,
    scannedTo,
    cursorAfter,

    observed,
    persisted,

    validationCandidates:
      candidates.length,

    validated,

    chainUnavailable,
  };
}
