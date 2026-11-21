import assert from "node:assert/strict";

import {
  releaseCommercialUtilityPackModule,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

type ModuleState =
  "WITHHELD" |
  "READY" |
  "RELEASED";

type ResourceState =
  "WITHHELD" |
  "RELEASED" |
  "SUPERSEDED" |
  "WITHDRAWN";

type PackState =
  "PREPARING" |
  "CURRENT" |
  "SUPERSEDED" |
  "WITHDRAWN";

type ReleaseState =
  "WITHHELD" |
  "PARTIAL" |
  "RELEASED";

type ModuleName =
  "REPRESENTATION" |
  "COMMERCIAL_PARAMETERS" |
  "DOCUMENTS" |
  "OPERATING_BOUNDARIES";

type Resource = {
  id: string;
  packageId: string;
  module: ModuleName;
  state: ResourceState;
  resourceType: string;
  resourceId: string;
  releasedByUserId:
    string | null;
  releasedAt:
    Date | null;
};

type Module = {
  id: string;
  packageId: string;
  module: ModuleName;
  state: ModuleState;
  releasedByUserId:
    string | null;
  releasedAt:
    Date | null;
};

type Pack = {
  id: string;
  state: PackState;
  releaseState:
    ReleaseState;
  releasedByUserId:
    string | null;
  releasedAt:
    Date | null;
};

type EventRecord = {
  eventType: string;
  payload: unknown;
};

function initialState() {
  return {
    transactionCount:
      0,

    failModuleEvent:
      false,

    pack: {
      id:
        "cup-release-001",

      state:
        "PREPARING" as PackState,

      releaseState:
        "WITHHELD" as ReleaseState,

      releasedByUserId:
        null,

      releasedAt:
        null,
    } satisfies Pack,

    modules: [
      {
        id:
          "module-representation",

        packageId:
          "cup-release-001",

        module:
          "REPRESENTATION",

        state:
          "READY",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        id:
          "module-commercial",

        packageId:
          "cup-release-001",

        module:
          "COMMERCIAL_PARAMETERS",

        state:
          "WITHHELD",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        id:
          "module-documents",

        packageId:
          "cup-release-001",

        module:
          "DOCUMENTS",

        state:
          "WITHHELD",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        id:
          "module-boundaries",

        packageId:
          "cup-release-001",

        module:
          "OPERATING_BOUNDARIES",

        state:
          "WITHHELD",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },
    ] as Module[],

    resources: [
      {
        id:
          "resource-profile",

        packageId:
          "cup-release-001",

        module:
          "REPRESENTATION",

        state:
          "WITHHELD",

        resourceType:
          "STRUCTURED_CONTENT",

        resourceId:
          "fw-profile",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      {
        id:
          "resource-profile-secondary",

        packageId:
          "cup-release-001",

        module:
          "REPRESENTATION",

        state:
          "WITHHELD",

        resourceType:
          "STRUCTURED_CONTENT",

        resourceId:
          "fw-profile-secondary",

        releasedByUserId:
          null,

        releasedAt:
          null,
      },

      /*
       * Historical records must not participate in the current release set.
       */
      {
        id:
          "resource-profile-old",

        packageId:
          "cup-release-001",

        module:
          "REPRESENTATION",

        state:
          "SUPERSEDED",

        resourceType:
          "STRUCTURED_CONTENT",

        resourceId:
          "fw-profile-old",

        releasedByUserId:
          "admin-1",

        releasedAt:
          new Date(
            "2026-10-01T00:00:00.000Z",
          ),
      },
    ] as Resource[],

    events:
      [] as EventRecord[],
  };
}

function cloneState<T>(
  value:
    T,
): T {
  return structuredClone(
    value,
  );
}

function createClient(
  state:
    ReturnType<
      typeof initialState
    >,
) {
  function transactionClient(
    draft:
      typeof state,
  ) {
    return {
      user: {
        async findUnique() {
          return {
            isAdmin:
              true,
          };
        },
      },

      commercialUtilityPack: {
        async findUnique(
          args:
            any,
        ) {
          if (
            args.where.id !==
            draft.pack.id
          ) {
            return null;
          }

          return draft.pack;
        },

        async updateMany(
          args:
            any,
        ) {
          if (
            args.where.id !==
              draft.pack.id ||
            (
              args.where.releaseState !==
                undefined &&
              args.where.releaseState !==
                draft.pack.releaseState
            ) ||
            (
              args.where.state !==
                undefined &&
              args.where.state !==
                draft.pack.state
            )
          ) {
            return {
              count:
                0,
            };
          }

          Object.assign(
            draft.pack,
            args.data,
          );

          return {
            count:
              1,
          };
        },
      },

      commercialUtilityPackModuleRelease: {
        async findUnique(
          args:
            any,
        ) {
          if (
            args.where.id
          ) {
            return (
              draft.modules.find(
                (entry) =>
                  entry.id ===
                  args.where.id,
              ) ??
              null
            );
          }

          const composite =
            args.where
              .packageId_module;

          if (!composite) {
            return null;
          }

          const found =
            draft.modules.find(
              (entry) =>
                entry.packageId ===
                  composite.packageId &&
                entry.module ===
                  composite.module,
            ) ??
            null;

          if (
            !found ||
            !args.select
          ) {
            return found;
          }

          return {
            ...(args.select.id
              ? {
                  id:
                    found.id,
                }
              : {}),

            ...(args.select.state
              ? {
                  state:
                    found.state,
                }
              : {}),
          };
        },

        async findMany(
          args:
            any,
        ) {
          return draft.modules
            .filter(
              (entry) =>
                entry.packageId ===
                args.where.packageId,
            )
            .map(
              (entry) => ({
                module:
                  entry.module,

                state:
                  entry.state,
              }),
            );
        },

        async updateMany(
          args:
            any,
        ) {
          const found =
            draft.modules.find(
              (entry) =>
                entry.id ===
                  args.where.id &&
                entry.state ===
                  args.where.state,
            );

          if (!found) {
            return {
              count:
                0,
            };
          }

          Object.assign(
            found,
            args.data,
          );

          return {
            count:
              1,
          };
        },
      },

      commercialUtilityPackResourceRelease: {
        async findUnique(
          args:
            any,
        ) {
          return (
            draft.resources.find(
              (entry) =>
                entry.id ===
                args.where.id,
            ) ??
            null
          );
        },

        async findMany(
          args:
            any,
        ) {
          const states:
            string[] =
              args.where.state?.in ??
              [];

          const found =
            draft.resources.filter(
              (entry) =>
                entry.packageId ===
                  args.where.packageId &&
                entry.module ===
                  args.where.module &&
                states.includes(
                  entry.state,
                ),
            );

          if (!args.select) {
            return found;
          }

          return found.map(
            (entry) => ({
              ...(args.select.id
                ? {
                    id:
                      entry.id,
                  }
                : {}),

              ...(args.select.state
                ? {
                    state:
                      entry.state,
                  }
                : {}),
            }),
          );
        },

        async updateMany(
          args:
            any,
        ) {
          const found =
            draft.resources.find(
              (entry) =>
                entry.id ===
                  args.where.id &&
                entry.state ===
                  args.where.state,
            );

          if (!found) {
            return {
              count:
                0,
            };
          }

          Object.assign(
            found,
            args.data,
          );

          return {
            count:
              1,
          };
        },
      },

      domainEvent: {
        async create(
          args:
            any,
        ) {
          const eventType =
            String(
              args.data.eventType,
            );

          if (
            draft.failModuleEvent &&
            eventType ===
              "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED"
          ) {
            throw new Error(
              "SIMULATED_MODULE_RELEASE_EVENT_FAILURE",
            );
          }

          draft.events.push({
            eventType,

            payload:
              args.data.payload,
          });

          return {
            id:
              `event-${draft.events.length}`,

            ...args.data,
          };
        },
      },
    };
  }

  return {
    async $transaction(
      operation:
        (
          tx:
            ReturnType<
              typeof transactionClient
            >,
        ) => Promise<any>,
    ) {
      state.transactionCount +=
        1;

      const draft =
        cloneState(
          state,
        );

      /*
       * Preserve observational transaction count across commit/rollback.
       */
      draft.transactionCount =
        state.transactionCount;

      try {
        const result =
          await operation(
            transactionClient(
              draft,
            ),
          );

        const transactionCount =
          state.transactionCount;

        Object.assign(
          state,
          draft,
        );

        state.transactionCount =
          transactionCount;

        return result;
      } catch (error) {
        throw error;
      }
    },
  };
}

async function successAndReplaySmoke() {
  const state =
    initialState();

  const client =
    createClient(
      state,
    );

  const occurredAt =
    new Date(
      "2026-10-05T20:00:00.000Z",
    );

  const released =
    await releaseCommercialUtilityPackModule({
      client:
        client as never,

      packageId:
        state.pack.id,

      module:
        "REPRESENTATION",

      actorUserId:
        "admin-1",

      occurredAt,
    });

  assert.equal(
    state.transactionCount,
    1,
  );

  assert.equal(
    released.currentResourceCount,
    2,
  );

  assert.equal(
    released.releasedResourceCount,
    2,
  );

  assert.equal(
    released.moduleTransitioned,
    true,
  );

  assert.equal(
    released.packageChanged,
    true,
  );

  const representation =
    state.modules.find(
      (entry) =>
        entry.module ===
        "REPRESENTATION",
    );

  assert.equal(
    representation?.state,
    "RELEASED",
  );

  const currentRepresentationResources =
    state.resources.filter(
      (entry) =>
        entry.module ===
          "REPRESENTATION" &&
        (
          entry.state ===
            "WITHHELD" ||
          entry.state ===
            "RELEASED"
        ),
    );

  assert.equal(
    currentRepresentationResources.length,
    2,
  );

  assert.ok(
    currentRepresentationResources.every(
      (entry) =>
        entry.state ===
        "RELEASED",
    ),
  );

  assert.equal(
    state.resources.find(
      (entry) =>
        entry.id ===
        "resource-profile-old",
    )?.state,
    "SUPERSEDED",
  );

  assert.equal(
    state.pack.state,
    "PREPARING",
  );

  assert.equal(
    state.pack.releaseState,
    "PARTIAL",
  );

  assert.equal(
    state.events.filter(
      (entry) =>
        entry.eventType ===
        "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASED",
    ).length,
    2,
  );

  assert.equal(
    state.events.filter(
      (entry) =>
        entry.eventType ===
        "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED",
    ).length,
    1,
  );

  assert.equal(
    state.events.filter(
      (entry) =>
        entry.eventType ===
        "COMMERCIAL_UTILITY_PACK_RELEASE_STATE_CHANGED",
    ).length,
    1,
  );

  const eventCountAfterFirstRelease =
    state.events.length;

  const replay =
    await releaseCommercialUtilityPackModule({
      client:
        client as never,

      packageId:
        state.pack.id,

      module:
        "REPRESENTATION",

      actorUserId:
        "admin-1",

      occurredAt,
    });

  assert.equal(
    state.transactionCount,
    2,
  );

  assert.equal(
    replay.currentResourceCount,
    2,
  );

  assert.equal(
    replay.releasedResourceCount,
    0,
  );

  assert.equal(
    replay.moduleTransitioned,
    false,
  );

  assert.equal(
    replay.packageChanged,
    false,
  );

  assert.equal(
    state.events.length,
    eventCountAfterFirstRelease,
  );

  console.log(
    "✓ READY module releases every current resource in one transaction",
  );

  console.log(
    "✓ historical SUPERSEDED resource is excluded from current release set",
  );

  console.log(
    "✓ module transitions READY → RELEASED only after all current resources release",
  );

  console.log(
    "✓ package reconciliation derives PARTIAL / PREPARING",
  );

  console.log(
    "✓ exact module-release replay creates no duplicate release events",
  );
}

async function notReadySmoke() {
  const state =
    initialState();

  state.modules[0].state =
    "WITHHELD";

  const client =
    createClient(
      state,
    );

  await assert.rejects(
    () =>
      releaseCommercialUtilityPackModule({
        client:
          client as never,

        packageId:
          state.pack.id,

        module:
          "REPRESENTATION",

        actorUserId:
          "admin-1",
      }),

    /CUP_MODULE_RELEASE_APPLICATION_MODULE_NOT_READY/,
  );

  assert.ok(
    state.resources
      .filter(
        (entry) =>
          entry.id !==
          "resource-profile-old",
      )
      .every(
        (entry) =>
          entry.state ===
          "WITHHELD",
      ),
  );

  assert.equal(
    state.events.length,
    0,
  );

  console.log(
    "✓ WITHHELD module cannot enter release application",
  );
}

async function rollbackSmoke() {
  const state =
    initialState();

  state.failModuleEvent =
    true;

  const client =
    createClient(
      state,
    );

  await assert.rejects(
    () =>
      releaseCommercialUtilityPackModule({
        client:
          client as never,

        packageId:
          state.pack.id,

        module:
          "REPRESENTATION",

        actorUserId:
          "admin-1",

        occurredAt:
          new Date(
            "2026-10-05T20:05:00.000Z",
          ),
      }),

    /SIMULATED_MODULE_RELEASE_EVENT_FAILURE/,
  );

  assert.equal(
    state.transactionCount,
    1,
  );

  assert.equal(
    state.modules.find(
      (entry) =>
        entry.module ===
        "REPRESENTATION",
    )?.state,
    "READY",
  );

  assert.equal(
    state.resources.find(
      (entry) =>
        entry.id ===
        "resource-profile",
    )?.state,
    "WITHHELD",
  );

  assert.equal(
    state.resources.find(
      (entry) =>
        entry.id ===
        "resource-profile-secondary",
    )?.state,
    "WITHHELD",
  );

  assert.equal(
    state.pack.state,
    "PREPARING",
  );

  assert.equal(
    state.pack.releaseState,
    "WITHHELD",
  );

  assert.equal(
    state.events.length,
    0,
  );

  console.log(
    "✓ downstream module transition failure rolls back resource releases",
  );

  console.log(
    "✓ failed module release leaves package reconciliation untouched",
  );
}

async function releasedContradictionSmoke() {
  const state =
    initialState();

  state.modules[0].state =
    "RELEASED";

  state.resources[0].state =
    "RELEASED";

  /*
   * One current resource remains WITHHELD: this must not be silently repaired.
   */
  state.resources[1].state =
    "WITHHELD";

  const client =
    createClient(
      state,
    );

  await assert.rejects(
    () =>
      releaseCommercialUtilityPackModule({
        client:
          client as never,

        packageId:
          state.pack.id,

        module:
          "REPRESENTATION",

        actorUserId:
          "admin-1",
      }),

    /CUP_MODULE_RELEASE_APPLICATION_RELEASED_MODULE_RESOURCE_CONTRADICTION/,
  );

  assert.equal(
    state.events.length,
    0,
  );

  console.log(
    "✓ RELEASED module with WITHHELD current resource is rejected as contradiction",
  );
}

async function main() {
  await successAndReplaySmoke();

  await notReadySmoke();

  await rollbackSmoke();

  await releasedContradictionSmoke();

  console.log(
    "✓ module release application performs no permission mutation",
  );

  console.log(
    "✓ one explicit module decision owns resource release + module release + reconciliation",
  );

  console.log(
    "CUP_1G_MODULE_RELEASE_APPLICATION_OK",
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exit(
      1,
    );
  },
);
