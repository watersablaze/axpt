import assert from "node:assert/strict";

import {
  prepareCommercialUtilityPack,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/prepareCommercialUtilityPack";

type Pack = {
  id: string;
  reference: string;
  participantId: string;
  version: number;
  state: string;
  releaseState: string;
  audience: string;
  createdByUserId: string;
  modules: Array<{
    module: string;
    state: string;
  }>;
};

async function main() {
  const state = {
    transactionCount: 0,
    createCount: 0,
    eventCount: 0,
    pack: null as Pack | null,
    forceFirstUniqueCollision: true,
  };

  const canonicalPack: Pack = {
    id:
      "cup-concurrent-replay-001",
    reference:
      "FWI-26-RP-020-CUP-001",
    participantId:
      "participant-concurrent-replay",
    version:
      1,
    state:
      "PREPARING",
    releaseState:
      "WITHHELD",
    audience:
      "REPRESENTATIVE",
    createdByUserId:
      "admin-concurrent-replay",
    modules: [
      {
        module:
          "REPRESENTATION",
        state:
          "WITHHELD",
      },
      {
        module:
          "COMMERCIAL_PARAMETERS",
        state:
          "WITHHELD",
      },
      {
        module:
          "DOCUMENTS",
        state:
          "WITHHELD",
      },
      {
        module:
          "OPERATING_BOUNDARIES",
        state:
          "WITHHELD",
      },
    ],
  };

  const tx = {
    user: {
      findUnique: async () => ({
        isAdmin: true,
      }),
    },

    representativeProgramParticipant: {
      findUnique: async () => ({
        id:
          "participant-concurrent-replay",
        docketReference:
          "FWI-26-RP-020",
        standing:
          "PROVISIONAL",
      }),
    },

    commercialUtilityPack: {
      findUnique: async (
        args: {
          where:
            | {
                participantId_version: {
                  participantId: string;
                  version: number;
                };
              }
            | {
                reference: string;
              };
        },
      ) => {
        if (!state.pack) {
          return null;
        }

        if (
          "participantId_version" in
          args.where
        ) {
          const key =
            args.where
              .participantId_version;

          return (
            state.pack.participantId ===
              key.participantId &&
            state.pack.version ===
              key.version
          )
            ? state.pack
            : null;
        }

        return (
          state.pack.reference ===
          args.where.reference
        )
          ? {
              id:
                state.pack.id,
              participantId:
                state.pack.participantId,
              version:
                state.pack.version,
            }
          : null;
      },

      create: async () => {
        state.createCount += 1;

        if (
          state.forceFirstUniqueCollision
        ) {
          state.forceFirstUniqueCollision =
            false;

          /*
           * Model the competing transaction as having committed
           * before this transaction receives its uniqueness error.
           */
          state.pack =
            canonicalPack;

          const error =
            new Error(
              "Unique constraint failed",
            ) as Error & {
              code?: string;
            };

          error.code =
            "P2002";

          throw error;
        }

        throw new Error(
          "UNEXPECTED_SECOND_CREATE",
        );
      },
    },

    domainEvent: {
      create: async () => {
        state.eventCount += 1;

        throw new Error(
          "UNEXPECTED_EVENT_CREATE",
        );
      },
    },
  };

  const runner = {
    $transaction: async <T>(
      operation: (
        client:
          typeof tx,
      ) => Promise<T>,
    ): Promise<T> => {
      state.transactionCount += 1;

      return operation(tx);
    },
  };

  const result =
    await prepareCommercialUtilityPack({
      client:
        runner as never,
      participantId:
        "participant-concurrent-replay",
      actorUserId:
        "admin-concurrent-replay",
      occurredAt:
        new Date(
          "2026-10-05T13:45:00.000Z",
        ),
    });

  assert.equal(
    state.transactionCount,
    2,
    "P2002 recovery must use a fresh transaction",
  );

  assert.equal(
    state.createCount,
    1,
    "recovery must not attempt a second insert",
  );

  assert.equal(
    state.eventCount,
    0,
    "losing transaction must not create a second event",
  );

  assert.equal(
    result.created,
    false,
  );

  assert.equal(
    result.package.id,
    canonicalPack.id,
  );

  assert.equal(
    result.reference,
    "FWI-26-RP-020-CUP-001",
  );

  assert.equal(
    result.package.modules.length,
    4,
  );

  /*
   * Non-P2002 errors must not be swallowed or retried.
   */
  const failingRunner = {
    $transaction: async () => {
      throw new Error(
        "NON_UNIQUE_FAILURE",
      );
    },
  };

  await assert.rejects(
    () =>
      prepareCommercialUtilityPack({
        client:
          failingRunner as never,
        participantId:
          "participant-concurrent-replay",
        actorUserId:
          "admin-concurrent-replay",
      }),
    /NON_UNIQUE_FAILURE/,
  );

  console.log(
    "✓ P2002 collision rolls into fresh transaction",
  );

  console.log(
    "✓ fresh transaction resolves committed canonical CUP",
  );

  console.log(
    "✓ concurrent replay returns created=false",
  );

  console.log(
    "✓ recovery performs no duplicate insert",
  );

  console.log(
    "✓ recovery performs no duplicate creation event",
  );

  console.log(
    "✓ non-P2002 failures propagate unchanged",
  );

  console.log(
    "CUP_1C_CONCURRENT_REPLAY_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
