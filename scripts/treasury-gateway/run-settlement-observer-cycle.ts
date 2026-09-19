import {
  PrismaClient,
} from "@prisma/client";

import {
  runSettlementObserverCycleWithClient,
  type SettlementObserverCycleClient,
} from "@/domains/treasury/settlement-observer/runSettlementObserverCycleWithClient";

const ENABLE_TOKEN =
  "ENABLED";

function readOptionalBigInt(
  name: string,
): bigint | undefined {
  const value =
    process.env[name]
      ?.trim();

  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(
      `[SETTLEMENT_OBSERVER_ENV_INVALID] ${name}`,
    );
  }

  return BigInt(value);
}

function readOptionalPositiveInteger(
  name: string,
): number | undefined {
  const raw =
    process.env[name]
      ?.trim();

  if (!raw) {
    return undefined;
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(
      `[SETTLEMENT_OBSERVER_ENV_INVALID] ${name}`,
    );
  }

  const value =
    Number(raw);

  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `[SETTLEMENT_OBSERVER_ENV_INVALID] ${name}`,
    );
  }

  return value;
}

async function main() {
  /*
   * The runner is inert unless explicitly enabled.
   *
   * This prevents accidental production execution from a generic
   * script invocation, deployment build or operator shell.
   */
  if (
    process.env
      .TREASURY_SETTLEMENT_OBSERVER_ENABLED
      ?.trim() !==
    ENABLE_TOKEN
  ) {
    throw new Error(
      "[SETTLEMENT_OBSERVER_NOT_ENABLED]",
    );
  }

  if (
    !process.env.RPC_URL
      ?.trim()
  ) {
    throw new Error(
      "[SETTLEMENT_OBSERVER_RPC_URL_MISSING]",
    );
  }

  if (
    !process.env.DATABASE_URL
      ?.trim()
  ) {
    throw new Error(
      "[SETTLEMENT_OBSERVER_DATABASE_URL_MISSING]",
    );
  }

  const prisma =
    new PrismaClient({
      log: ["error"],
    });

  try {
    const result =
      await runSettlementObserverCycleWithClient({
        /*
         * Local structural cast contains the known project ambient
         * Prisma declaration shadow. Runtime authority remains the
         * generated PrismaClient instance.
         */
        client:
          prisma as unknown as
            SettlementObserverCycleClient,

        bootstrapFromBlock:
          readOptionalBigInt(
            "TREASURY_SETTLEMENT_OBSERVER_BOOTSTRAP_BLOCK",
          ),

        maxNewBlocksPerCycle:
          readOptionalBigInt(
            "TREASURY_SETTLEMENT_OBSERVER_MAX_NEW_BLOCKS",
          ),

        validationBatchSize:
          readOptionalPositiveInteger(
            "TREASURY_SETTLEMENT_OBSERVER_VALIDATION_BATCH",
          ),
      });

    console.log(
      JSON.stringify(
        {
          disposition:
            result.disposition,

          chainId:
            result.chainId,

          network:
            result.network,

          watchedAddress:
            result.watchedAddress,

          tokenContractAddress:
            result.tokenContractAddress,

          headBlock:
            result.headBlock.toString(),

          cursorBefore:
            result.cursorBefore
              ?.toString() ??
            null,

          scannedFrom:
            result.scannedFrom
              ?.toString() ??
            null,

          scannedTo:
            result.scannedTo
              ?.toString() ??
            null,

          cursorAfter:
            result.cursorAfter
              ?.toString() ??
            null,

          observed:
            result.observed,

          persisted:
            result.persisted,

          validationCandidates:
            result.validationCandidates,

          validated:
            result.validated,

          chainUnavailable:
            result.chainUnavailable,
        },
        null,
        2,
      ),
    );

    if (
      result.disposition ===
      "BOOTSTRAP_REQUIRED"
    ) {
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : String(error),
  );

  process.exitCode = 1;
});
