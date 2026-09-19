import {
  runSettlementObserverCycleWithClient,
  type SettlementObserverCycleClient,
} from "@/domains/treasury/settlement-observer/runSettlementObserverCycleWithClient";

import type {
  SettlementObservationChainState,
} from "@/domains/treasury/settlement-observer/validationContracts";

import type {
  UsdtTransferEvent,
} from "@/lib/treasury/transfers";

const OPERATIONS =
  "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";

const USDT =
  "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const SENDER =
  "0x1111111111111111111111111111111111111111";

const TX =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const BLOCK_HASH =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const REORG_HASH =
  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `[ER_AO_7B_ASSERTION_FAILED] ${message}`,
    );
  }
}

type Observation = {
  id: string;
  chainId: number;
  network: string;
  tokenContractAddress: string;
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
  blockHash: string | null;
  fromAddress: string;
  toAddress: string;
  amountBaseUnits: {
    toString(): string;
  };
  direction: "IN" | "OUT";
  status:
    | "DETECTED"
    | "VALIDATED"
    | "CONFIRMING"
    | "CONFIRMED"
    | "FAILED"
    | "ORPHANED";
  detectedAt: Date;
  chainTimestamp: Date | null;
  validatedAt: Date | null;
  confirmedAt: Date | null;
  confirmationCount: number;
  requiredConfirmations: number;
};

type Cursor = {
  id: string;
  chainId: number;
  network: string;
  tokenContractAddress: string;
  watchedAddress: string;
  lastScannedBlock: bigint;
  lastScannedBlockHash: string | null;
};

function makeMemoryClient() {
  const observations =
    new Map<string, Observation>();

  const cursors =
    new Map<string, Cursor>();

  let observationSequence =
    1;

  let cursorSequence =
    1;

  function observationKey(
    chainId: number,
    txHash: string,
    logIndex: number,
  ) {
    return [
      chainId,
      txHash.toLowerCase(),
      logIndex,
    ].join(":");
  }

  function cursorKey(
    chainId: number,
    tokenContractAddress: string,
    watchedAddress: string,
  ) {
    return [
      chainId,
      tokenContractAddress.toLowerCase(),
      watchedAddress.toLowerCase(),
    ].join(":");
  }

  const client = {
    treasurySettlementObservation: {
      async upsert(args: any) {
        const key =
          observationKey(
            args.where
              .chainId_txHash_logIndex
              .chainId,
            args.where
              .chainId_txHash_logIndex
              .txHash,
            args.where
              .chainId_txHash_logIndex
              .logIndex,
          );

        const existing =
          observations.get(key);

        if (existing) {
          return existing;
        }

        const created:
          Observation = {
            id:
              `obs-${observationSequence++}`,

            ...args.create,

            chainTimestamp:
              null,

            validatedAt:
              null,

            confirmedAt:
              null,
          };

        observations.set(
          key,
          created,
        );

        return created;
      },

      async findUnique(args: any) {
        if (
          args.where.id
        ) {
          return (
            [...observations.values()]
              .find(
                (row) =>
                  row.id ===
                  args.where.id,
              ) ??
            null
          );
        }

        return null;
      },

      async update(args: any) {
        const entry =
          [...observations.entries()]
            .find(
              ([, row]) =>
                row.id ===
                args.where.id,
            );

        if (!entry) {
          throw new Error(
            "OBSERVATION_NOT_FOUND",
          );
        }

        const [
          key,
          row,
        ] = entry;

        const updated = {
          ...row,
          ...args.data,
        };

        observations.set(
          key,
          updated,
        );

        return updated;
      },

      async findMany(args: any) {
        let rows =
          [...observations.values()];

        const where =
          args.where ?? {};

        rows =
          rows.filter(
            (row) =>
              row.chainId ===
                where.chainId &&
              row.network ===
                where.network &&
              row.tokenContractAddress ===
                where.tokenContractAddress &&
              row.toAddress ===
                where.toAddress &&
              where.status.in.includes(
                row.status,
              ),
          );

        rows.sort(
          (a, b) =>
            a.blockNumber ===
            b.blockNumber
              ? a.logIndex -
                b.logIndex
              : a.blockNumber <
                b.blockNumber
              ? -1
              : 1,
        );

        return rows
          .slice(
            0,
            args.take,
          )
          .map(
            (row) => ({
              id:
                row.id,
            }),
          );
      },
    },

    treasurySettlementObservationCursor: {
      async findUnique(args: any) {
        const selector =
          args.where
            .chainId_tokenContractAddress_watchedAddress;

        const key =
          cursorKey(
            selector.chainId,
            selector.tokenContractAddress,
            selector.watchedAddress,
          );

        const row =
          cursors.get(key) ??
          null;

        if (
          row &&
          args.select
        ) {
          return {
            lastScannedBlock:
              row.lastScannedBlock,
          };
        }

        return row;
      },

      async upsert(args: any) {
        const selector =
          args.where
            .chainId_tokenContractAddress_watchedAddress;

        const key =
          cursorKey(
            selector.chainId,
            selector.tokenContractAddress,
            selector.watchedAddress,
          );

        const existing =
          cursors.get(key);

        if (existing) {
          const updated = {
            ...existing,
            ...args.update,
          };

          cursors.set(
            key,
            updated,
          );

          return updated;
        }

        const created:
          Cursor = {
            id:
              `cursor-${cursorSequence++}`,

            ...args.create,
          };

        cursors.set(
          key,
          created,
        );

        return created;
      },
    },
  };

  return {
    client:
      client as unknown as
        SettlementObserverCycleClient,

    observations,

    cursors,
  };
}

function transfer(
  blockNumber: bigint,
  blockHash: `0x${string}` =
    BLOCK_HASH,
): UsdtTransferEvent {
  return {
    chainId: 1,
    network:
      "mainnet",

    tokenContractAddress:
      USDT,

    txHash:
      TX,

    logIndex:
      7,

    blockNumber,

    blockHash,

    from:
      SENDER,

    to:
      OPERATIONS,

    amountBaseUnits:
      50_000_000n,

    amount:
      "50",

    direction:
      "in",
  };
}

function successfulChainState(
  blockNumber: bigint,
  blockHash: string,
  latestBlockNumber: bigint,
  finalizedBlockNumber:
    bigint | null,
): SettlementObservationChainState {
  return {
    disposition:
      "AVAILABLE",

    receipt: {
      status:
        "success",

      blockNumber,
      blockHash,

      blockTimestamp:
        new Date(
          "2026-09-19T21:00:00.000Z",
        ),

      transferLogs: [
        {
          logIndex:
            7,

          tokenContractAddress:
            USDT,

          fromAddress:
            SENDER,

          toAddress:
            OPERATIONS,

          amountBaseUnits:
            50_000_000n,
        },
      ],
    },

    latestBlockNumber,

    finalizedBlockNumber,
  };
}

async function main() {
  {
    const memory =
      makeMemoryClient();

    const result =
      await runSettlementObserverCycleWithClient({
        client:
          memory.client,

        readChainId:
          async () =>
            1,

        readHeadBlock:
          async () =>
            1_000n,

        resolveBlockHash:
          async () =>
            BLOCK_HASH,

        readTransfers:
          async () =>
            [],

        readChainState:
          async () => {
            throw new Error(
              "SHOULD_NOT_VALIDATE",
            );
          },
      });

    assert(
      result.disposition ===
        "BOOTSTRAP_REQUIRED",
      "missing cursor must require explicit bootstrap",
    );

    assert(
      memory.cursors.size ===
        0,
      "bootstrap-required cycle must not create cursor",
    );

    console.log(
      "✓ bootstrap required",
    );
  }

  const memory =
    makeMemoryClient();

  let transferReads:
    Array<{
      fromBlock: bigint;
      toBlock: bigint;
    }> = [];

  let validationMode:
    | "CONFIRMING"
    | "UNAVAILABLE"
    | "FINAL"
    | "REORG" =
    "CONFIRMING";

  const readTransfers =
    async (
      input: {
        fromBlock: bigint;
        toBlock: bigint;
      },
    ) => {
      transferReads.push({
        fromBlock:
          input.fromBlock,

        toBlock:
          input.toBlock,
      });

      if (
        input.fromBlock <=
          1_002n &&
        input.toBlock >=
          1_002n
      ) {
        return [
          transfer(
            1_002n,
          ),
        ];
      }

      return [];
    };

  const readChainState =
    async () => {
      if (
        validationMode ===
        "UNAVAILABLE"
      ) {
        return {
          disposition:
            "UNAVAILABLE",

          errorCode:
            "FIXTURE_PROVIDER_DOWN",
        } as const;
      }

      if (
        validationMode ===
        "REORG"
      ) {
        return {
          disposition:
            "AVAILABLE",

          receipt:
            null,

          latestBlockNumber:
            1_030n,

          finalizedBlockNumber:
            1_020n,
        } as const;
      }

      if (
        validationMode ===
        "FINAL"
      ) {
        return successfulChainState(
          1_002n,
          BLOCK_HASH,
          1_030n,
          1_020n,
        );
      }

      return successfulChainState(
        1_002n,
        BLOCK_HASH,
        1_006n,
        1_000n,
      );
    };

  const first =
    await runSettlementObserverCycleWithClient({
      client:
        memory.client,

      bootstrapFromBlock:
        1_000n,

      maxNewBlocksPerCycle:
        5n,

      readChainId:
        async () =>
          1,

      readHeadBlock:
        async () =>
          1_010n,

      resolveBlockHash:
        async (
          blockNumber,
        ) =>
          blockNumber ===
          1_004n
            ? BLOCK_HASH
            : REORG_HASH,

      readTransfers:
        readTransfers as any,

      readChainState,
    });

  assert(
    first.disposition ===
      "ADVANCED",
    "bootstrap cycle should advance",
  );

  assert(
    first.scannedFrom ===
      1_000n,
    "bootstrap scan must start at explicit boundary",
  );

  assert(
    first.scannedTo ===
      1_004n,
    "bootstrap scan must honor max block bound",
  );

  assert(
    first.cursorAfter ===
      1_004n,
    "cursor must advance to bounded terminal block",
  );

  assert(
    memory.observations.size ===
      1,
    "one transfer must persist",
  );

  const firstObservation =
    [...memory.observations.values()][0];

  assert(
    firstObservation.status ===
      "CONFIRMING",
    "shallow valid transfer should be confirming",
  );

  console.log(
    "✓ bounded bootstrap ingestion",
  );

  validationMode =
    "UNAVAILABLE";

  const second =
    await runSettlementObserverCycleWithClient({
      client:
        memory.client,

      readChainId:
        async () =>
          1,

      readHeadBlock:
        async () =>
          1_008n,

      maxNewBlocksPerCycle:
        3n,

      resolveBlockHash:
        async () =>
          BLOCK_HASH,

      readTransfers:
        readTransfers as any,

      readChainState,
    });

  assert(
    second.scannedFrom ===
      993n,
    "existing cursor must rescan 12-block overlap",
  );

  assert(
    second.scannedTo ===
      1_007n,
    "forward advancement must remain bounded",
  );

  assert(
    memory.observations.size ===
      1,
    "overlap replay must remain idempotent",
  );

  assert(
    second.chainUnavailable ===
      1,
    "provider failure must surface as unavailable",
  );

  assert(
    firstObservation.status ===
      "CONFIRMING",
    "provider failure must not manufacture new chain state",
  );

  console.log(
    "✓ overlap replay + provider unavailable preservation",
  );

  validationMode =
    "FINAL";

  const third =
    await runSettlementObserverCycleWithClient({
      client:
        memory.client,

      readChainId:
        async () =>
          1,

      readHeadBlock:
        async () =>
          1_030n,

      maxNewBlocksPerCycle:
        5n,

      resolveBlockHash:
        async () =>
          BLOCK_HASH,

      readTransfers:
        async () =>
          [],

      readChainState,
    });

  const finalizedObservation =
    [...memory.observations.values()][0];

  assert(
    finalizedObservation.status ===
      "CONFIRMED",
    "deep finalized transfer must become confirmed",
  );

  assert(
    finalizedObservation.confirmationCount >=
      12,
    "confirmed transfer must satisfy depth policy",
  );

  console.log(
    "✓ finality confirmation",
  );

  /*
   * Separate fixture proves canonical receipt disappearance/reorg
   * classification without mutating the confirmed fixture above.
   */
  const reorgMemory =
    makeMemoryClient();

  validationMode =
    "REORG";

  await runSettlementObserverCycleWithClient({
    client:
      reorgMemory.client,

    bootstrapFromBlock:
      1_002n,

    maxNewBlocksPerCycle:
      1n,

    readChainId:
      async () =>
        1,

    readHeadBlock:
      async () =>
        1_002n,

    resolveBlockHash:
      async () =>
        BLOCK_HASH,

    readTransfers:
      async () => [
        transfer(
          1_002n,
        ),
      ],

    readChainState,
  });

  const reorged =
    [...reorgMemory.observations.values()][0];

  assert(
    reorged.status ===
      "ORPHANED",
    "receipt disappearance with chain evidence must orphan observation",
  );

  console.log(
    "✓ reorg/orphan classification",
  );

  assert(
    transferReads.length >=
      2,
    "fixture must exercise more than one poll cycle",
  );

  console.log(
    "════════════════════════════════════════════════════════════",
  );

  console.log(
    " ER-AO-7B DETERMINISTIC OBSERVER SMOKE PASSED",
  );

  console.log(
    " NO RPC CALL",
  );

  console.log(
    " NO DATABASE CONNECTION",
  );

  console.log(
    " NO PRODUCTION MUTATION",
  );

  console.log(
    "════════════════════════════════════════════════════════════",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
