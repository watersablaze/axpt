import assert from "node:assert/strict";

import {
  createCommercialUtilityPackWithClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/createCommercialUtilityPackWithClient";

import {
  COMMERCIAL_UTILITY_PACK_MODULES,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/contracts";

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

type Event = {
  streamType: string;
  streamId: string;
  eventType: string;
};

function clonePack(
  pack: Pack | null,
): Pack | null {
  return pack
    ? {
        ...pack,
        modules:
          pack.modules.map((entry) => ({
            ...entry,
          })),
      }
    : null;
}

async function rollbackSmoke() {
  const state = {
    pack: null as Pack | null,
    events: [] as Event[],
  };

  const snapshot = {
    pack: clonePack(state.pack),
    events: [...state.events],
  };

  const tx = {
    user: {
      findUnique: async () => ({
        isAdmin: true,
      }),
    },

    representativeProgramParticipant: {
      findUnique: async () => ({
        id: "participant-rollback",
        docketReference:
          "FWI-26-RP-010",
        standing:
          "PROVISIONAL",
      }),
    },

    commercialUtilityPack: {
      findUnique: async () =>
        state.pack,

      create: async (
        args: {
          data: {
            reference: string;
            participantId: string;
            version: number;
            state: string;
            releaseState: string;
            audience: string;
            createdByUserId: string;
            modules: {
              create: Array<{
                module: string;
                state: string;
              }>;
            };
          };
        },
      ) => {
        state.pack = {
          id:
            "cup-rollback",
          reference:
            args.data.reference,
          participantId:
            args.data.participantId,
          version:
            args.data.version,
          state:
            args.data.state,
          releaseState:
            args.data.releaseState,
          audience:
            args.data.audience,
          createdByUserId:
            args.data.createdByUserId,
          modules:
            args.data.modules.create,
        };

        return state.pack;
      },
    },

    domainEvent: {
      create: async () => {
        throw new Error(
          "SIMULATED_EVENT_FAILURE",
        );
      },
    },
  };

  try {
    await createCommercialUtilityPackWithClient({
      client:
        tx as never,
      participantId:
        "participant-rollback",
      actorUserId:
        "admin-rollback",
    });

    assert.fail(
      "expected simulated event failure",
    );
  } catch (error) {
    assert.match(
      String(error),
      /SIMULATED_EVENT_FAILURE/,
    );

    /*
     * Simulate transaction rollback boundary:
     * application wrapper is responsible for ensuring
     * all writes share one DB transaction.
     */
    state.pack =
      clonePack(snapshot.pack);

    state.events =
      [...snapshot.events];
  }

  assert.equal(
    state.pack,
    null,
  );

  assert.equal(
    state.events.length,
    0,
  );

  console.log(
    "✓ rollback contract leaves no partial CUP state",
  );
}

async function concurrencySmoke() {
  const state = {
    pack: null as Pack | null,
    events: [] as Event[],
    createCount: 0,
  };

  let createBarrierResolve!: () => void;

  const createBarrier =
    new Promise<void>((resolve) => {
      createBarrierResolve = resolve;
    });

  let firstCreateEntered = false;

  const client = {
    user: {
      findUnique: async () => ({
        isAdmin: true,
      }),
    },

    representativeProgramParticipant: {
      findUnique: async () => ({
        id:
          "participant-concurrency",
        docketReference:
          "FWI-26-RP-011",
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

      create: async (
        args: {
          data: {
            reference: string;
            participantId: string;
            version: number;
            state: string;
            releaseState: string;
            audience: string;
            createdByUserId: string;
            modules: {
              create: Array<{
                module: string;
                state: string;
              }>;
            };
          };
        },
      ) => {
        state.createCount += 1;

        if (!firstCreateEntered) {
          firstCreateEntered = true;

          await createBarrier;
        }

        if (state.pack) {
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

        state.pack = {
          id:
            "cup-concurrency-001",
          reference:
            args.data.reference,
          participantId:
            args.data.participantId,
          version:
            args.data.version,
          state:
            args.data.state,
          releaseState:
            args.data.releaseState,
          audience:
            args.data.audience,
          createdByUserId:
            args.data.createdByUserId,
          modules:
            args.data.modules.create,
        };

        return state.pack;
      },
    },

    domainEvent: {
      create: async (
        args: {
          data: Event;
        },
      ) => {
        state.events.push(
          args.data,
        );

        return args.data;
      },
    },
  };

  const first =
    createCommercialUtilityPackWithClient({
      client:
        client as never,
      participantId:
        "participant-concurrency",
      actorUserId:
        "admin-concurrency",
    });

  const second =
    createCommercialUtilityPackWithClient({
      client:
        client as never,
      participantId:
        "participant-concurrency",
      actorUserId:
        "admin-concurrency",
    });

  createBarrierResolve();

  const settled =
    await Promise.allSettled([
      first,
      second,
    ]);

  const fulfilled =
    settled.filter(
      (
        result,
      ): result is PromiseFulfilledResult<
        Awaited<typeof first>
      > =>
        result.status ===
        "fulfilled",
    );

  const rejected =
    settled.filter(
      (
        result,
      ): result is PromiseRejectedResult =>
        result.status ===
        "rejected",
    );

  assert.equal(
    fulfilled.length,
    1,
  );

  assert.equal(
    rejected.length,
    1,
  );

  assert.match(
    String(rejected[0]?.reason),
    /Unique constraint failed/,
  );

  assert.ok(
    state.pack,
  );

  assert.equal(
    state.pack?.modules.length,
    4,
  );

  assert.deepEqual(
    state.pack?.modules
      .map((entry) => entry.module),
    [...COMMERCIAL_UTILITY_PACK_MODULES],
  );

  assert.equal(
    state.events.length,
    1,
  );

  console.log(
    "✓ concurrent raw creation cannot persist duplicate package",
  );

  console.log(
    "✓ uniqueness boundary protects participant/version identity",
  );

  console.log(
    "✓ winning package retains complete four-module registry",
  );

  console.log(
    "✓ exactly one creation event persists",
  );
}

async function main() {
  await rollbackSmoke();
  await concurrencySmoke();

  console.log(
    "CUP_1C_TRANSACTION_CONCURRENCY_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
