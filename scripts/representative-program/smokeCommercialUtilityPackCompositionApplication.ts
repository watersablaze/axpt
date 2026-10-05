import assert from "node:assert/strict";

import {
  applyCommercialUtilityPackComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

type ModuleState =
  | "WITHHELD"
  | "READY"
  | "RELEASED";

type ResourceState =
  | "WITHHELD"
  | "RELEASED"
  | "SUPERSEDED"
  | "WITHDRAWN";

type ModuleRecord = {
  id: string;
  packageId: string;
  module:
    | "REPRESENTATION"
    | "COMMERCIAL_PARAMETERS"
    | "DOCUMENTS"
    | "OPERATING_BOUNDARIES";
  state: ModuleState;
  releasedByUserId: string | null;
  releasedAt: Date | null;
};

type ResourceRecord = {
  id: string;
  packageId: string;
  module:
    | "REPRESENTATION"
    | "COMMERCIAL_PARAMETERS"
    | "DOCUMENTS"
    | "OPERATING_BOUNDARIES";
  resourceType:
    | "INSTITUTIONAL_INSTRUMENT"
    | "DOCUMENT"
    | "STRUCTURED_CONTENT";
  resourceId: string;
  state: ResourceState;
  label: string | null;
  canView: boolean;
  canDownload: boolean;
  canPresent: boolean;
  canTransmit: boolean;
};

type EventRecord = {
  eventType: string;
  payload: unknown;
};

function initialState() {
  return {
    transactionCount:
      0,

    package: {
      id:
        "cup-application-001",

      participantId:
        "participant-application",

      state:
        "PREPARING",

      releaseState:
        "WITHHELD",
    },

    modules: [
      {
        id:
          "module-representation",
        packageId:
          "cup-application-001",
        module:
          "REPRESENTATION",
        state:
          "WITHHELD",
        releasedByUserId:
          null,
        releasedAt:
          null,
      },
      {
        id:
          "module-commercial",
        packageId:
          "cup-application-001",
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
          "cup-application-001",
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
          "cup-application-001",
        module:
          "OPERATING_BOUNDARIES",
        state:
          "WITHHELD",
        releasedByUserId:
          null,
        releasedAt:
          null,
      },
    ] as ModuleRecord[],

    resources:
      [] as ResourceRecord[],

    events:
      [] as EventRecord[],

    nextResource:
      1,

    failModuleEvent:
      null as string | null,
  };
}

let state =
  initialState();

function cloneState(
  value:
    ReturnType<typeof initialState>,
) {
  return structuredClone(
    value,
  );
}

function txClient(
  draft:
    ReturnType<typeof initialState>,
) {
  return {
    user: {
      findUnique:
        async () => ({
          isAdmin:
            true,
        }),
    },

    representativeProgramParticipant: {
      findUnique:
        async (
          args: any,
        ) => {
          /*
           * Composition Master Agreement projection.
           *
           * The resolver's custom structural client contract is richer
           * than this smoke needs. Returning the admitted participant and
           * executed agreement projection is sufficient for the branch
           * exercised here.
           */
          if (
            args.where?.id ===
              "participant-application"
          ) {
            return {
              id:
                "participant-application",

              onboardingIntake: {
                masterAgreementInstrumentId:
                  "instrument-ma",

                masterAgreementInstrument: {
                  id:
                    "instrument-ma",

                  reference:
                    "FWI-26-RP-001-MA",

                  title:
                    "Representative Program Master Agreement",

                  kind:
                    "REPRESENTATIVE_PROGRAM_AGREEMENT",

                  status:
                    "EXECUTED",
                },
              },
            };
          }

          return null;
        },
    },

    /*
     * The Source Authority branch is intentionally not selected in this
     * smoke. No SAI persistence call should be required.
     */
    institutionalInstrument: {
      findUnique:
        async () => null,

      findFirst:
        async () => null,
    },

    instrumentParty: {
      findMany:
        async () => [],
    },

    instrumentEvidence: {
      findMany:
        async () => [],
    },

    instrumentRelation: {
      findMany:
        async () => [],
    },

    sourceAuthorityProfile: {
      findUnique:
        async () => null,
    },

    commercialUtilityPack: {
      findUnique:
        async (
          args: any,
        ) => {
          if (
            args.where?.id ===
              draft.package.id
          ) {
            if (
              args.select?.participantId
            ) {
              return {
                id:
                  draft.package.id,

                participantId:
                  draft.package.participantId,

                modules:
                  args.select?.modules
                    ? draft.modules.map(
                        (module) => ({
                          module:
                            module.module,

                          state:
                            module.state,
                        }),
                      )
                    : undefined,
              };
            }

            if (
              args.include?.modules
            ) {
              const requested =
                args.include.modules.where
                  ?.module;

              return {
                ...draft.package,

                modules:
                  requested
                    ? draft.modules.filter(
                        (module) =>
                          module.module ===
                            requested,
                      )
                    : draft.modules,
              };
            }

            return {
              ...draft.package,
            };
          }

          return null;
        },
    },

    commercialUtilityPackResourceRelease: {
      findUnique:
        async (
          args: any,
        ) => {
          const key =
            args.where
              ?.packageId_module_resourceType_resourceId;

          if (!key) {
            return null;
          }

          return (
            draft.resources.find(
              (resource) =>
                resource.packageId ===
                  key.packageId &&
                resource.module ===
                  key.module &&
                resource.resourceType ===
                  key.resourceType &&
                resource.resourceId ===
                  key.resourceId,
            ) ?? null
          );
        },

      findMany:
        async (
          args: any,
        ) => {
          let resources =
            draft.resources.filter(
              (resource) =>
                resource.packageId ===
                  args.where.packageId,
            );

          if (
            args.where.module
          ) {
            resources =
              resources.filter(
                (resource) =>
                  resource.module ===
                    args.where.module,
              );
          }

          if (
            args.where.state?.in
          ) {
            resources =
              resources.filter(
                (resource) =>
                  args.where.state.in.includes(
                    resource.state,
                  ),
              );
          }

          if (
            args.select?.id &&
            args.select?.state &&
            !args.select?.module
          ) {
            return resources.map(
              (resource) => ({
                id:
                  resource.id,

                state:
                  resource.state,
              }),
            );
          }

          return resources.map(
            (resource) => ({
              module:
                resource.module,

              resourceType:
                resource.resourceType,

              resourceId:
                resource.resourceId,

              state:
                resource.state,
            }),
          );
        },

      create:
        async (
          args: any,
        ) => {
          const resource:
            ResourceRecord =
          {
            id:
              `resource-${draft.nextResource++}`,

            packageId:
              args.data.packageId,

            module:
              args.data.module,

            resourceType:
              args.data.resourceType,

            resourceId:
              args.data.resourceId,

            state:
              args.data.state,

            label:
              args.data.label,

            canView:
              args.data.canView,

            canDownload:
              args.data.canDownload,

            canPresent:
              args.data.canPresent,

            canTransmit:
              args.data.canTransmit,
          };

          draft.resources.push(
            resource,
          );

          return resource;
        },
    },

    commercialUtilityPackModuleRelease: {
      findUnique:
        async (
          args: any,
        ) => {
          const key =
            args.where
              ?.packageId_module;

          if (key) {
            return (
              draft.modules.find(
                (module) =>
                  module.packageId ===
                    key.packageId &&
                  module.module ===
                    key.module,
              ) ?? null
            );
          }

          if (
            args.where?.id
          ) {
            return (
              draft.modules.find(
                (module) =>
                  module.id ===
                    args.where.id,
              ) ?? null
            );
          }

          return null;
        },

      updateMany:
        async (
          args: any,
        ) => {
          const module =
            draft.modules.find(
              (entry) =>
                entry.id ===
                  args.where.id &&
                entry.state ===
                  args.where.state,
            );

          if (!module) {
            return {
              count:
                0,
            };
          }

          module.state =
            args.data.state;

          module.releasedByUserId =
            args.data.releasedByUserId;

          module.releasedAt =
            args.data.releasedAt;

          return {
            count:
              1,
          };
        },
    },

    domainEvent: {
      create:
        async (
          args: any,
        ) => {
          const eventType =
            String(
              args.data.eventType,
            );

          const module =
            (
              args.data.payload &&
              typeof args.data.payload ===
                "object" &&
              "module" in
                args.data.payload
            )
              ? String(
                  args.data.payload.module,
                )
              : null;

          if (
            draft.failModuleEvent &&
            eventType ===
              "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED" &&
            module ===
              draft.failModuleEvent
          ) {
            throw new Error(
              "SIMULATED_READY_EVENT_FAILURE",
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
          };
        },
    },
  };
}

function runner() {
  return {
    $transaction:
      async <T>(
        operation:
          (tx: any) => Promise<T>,
      ): Promise<T> => {
        state.transactionCount +=
          1;

        const before =
          cloneState(
            state,
          );

        const draft =
          cloneState(
            state,
          );

        try {
          const result =
            await operation(
              txClient(
                draft,
              ),
            );

          state =
            draft;

          return result;
        } catch (error) {
          /*
           * Model database rollback.
           */
          state =
            before;

          throw error;
        }
      },
  };
}

async function successSmoke() {
  state =
    initialState();

  const result =
    await applyCommercialUtilityPackComposition({
      client:
        runner() as never,

      packageId:
        state.package.id,

      participantId:
        state.package.participantId,

      actorUserId:
        "admin-composition-application",

      occurredAt:
        new Date(
          "2026-10-05T18:00:00.000Z",
        ),
    });

  assert.equal(
    state.transactionCount,
    1,
  );

  assert.equal(
    result.registration.registered.length,
    3,
  );

  assert.equal(
    result.registration.unavailableCount,
    2,
  );

  assert.deepEqual(
    result.eligibleModules,
    [
      "REPRESENTATION",
      "DOCUMENTS",
      "OPERATING_BOUNDARIES",
    ],
  );

  assert.deepEqual(
    result.blockedModules,
    [
      "COMMERCIAL_PARAMETERS",
    ],
  );

  assert.equal(
    state.resources.length,
    3,
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.state ===
          "WITHHELD",
    ),
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.canView ===
          true &&
        resource.canDownload ===
          false &&
        resource.canPresent ===
          false &&
        resource.canTransmit ===
          false,
    ),
  );

  for (
    const module of [
      "REPRESENTATION",
      "DOCUMENTS",
      "OPERATING_BOUNDARIES",
    ] as const
  ) {
    assert.equal(
      state.modules.find(
        (record) =>
          record.module ===
            module,
      )?.state,
      "READY",
    );
  }

  assert.equal(
    state.modules.find(
      (record) =>
        record.module ===
          "COMMERCIAL_PARAMETERS",
    )?.state,
    "WITHHELD",
  );

  assert.equal(
    state.package.state,
    "PREPARING",
  );

  assert.equal(
    state.package.releaseState,
    "WITHHELD",
  );

  console.log(
    "✓ one transaction resolves, registers, assesses, and applies READY",
  );

  console.log(
    "✓ three available canonical resources register WITHHELD",
  );

  console.log(
    "✓ eligible modules enter READY",
  );

  console.log(
    "✓ blocked Commercial Parameters remain WITHHELD without transaction failure",
  );

  console.log(
    "✓ composition application performs no release or package reconciliation",
  );
}

async function replaySmoke() {
  const resourcesBefore =
    state.resources.length;

  const eventsBefore =
    state.events.length;

  const replay =
    await applyCommercialUtilityPackComposition({
      client:
        runner() as never,

      packageId:
        state.package.id,

      participantId:
        state.package.participantId,

      actorUserId:
        "admin-composition-application",
    });

  assert.equal(
    state.resources.length,
    resourcesBefore,
  );

  assert.equal(
    replay.registration.registered.every(
      (entry) =>
        entry.created ===
          false,
    ),
    true,
  );

  assert.equal(
    state.events.length,
    eventsBefore,
  );

  assert.ok(
    replay.readinessApplications.every(
      (entry) =>
        entry.transitioned ===
          false,
    ),
  );

  console.log(
    "✓ exact transactional replay creates no duplicate resources",
  );

  console.log(
    "✓ exact transactional replay creates no duplicate READY events",
  );
}

async function rollbackSmoke() {
  state =
    initialState();

  state.failModuleEvent =
    "DOCUMENTS";

  const before =
    cloneState(
      state,
    );

  await assert.rejects(
    () =>
      applyCommercialUtilityPackComposition({
        client:
          runner() as never,

        packageId:
          state.package.id,

        participantId:
          state.package.participantId,

        actorUserId:
          "admin-composition-application",
      }),

    /SIMULATED_READY_EVENT_FAILURE/,
  );

  assert.equal(
    state.resources.length,
    before.resources.length,
  );

  assert.deepEqual(
    state.modules,
    before.modules,
  );

  assert.deepEqual(
    state.events,
    before.events,
  );

  console.log(
    "✓ downstream READY failure rolls back resource registration and earlier READY transitions",
  );
}

async function participantBindingSmoke() {
  state =
    initialState();

  await assert.rejects(
    () =>
      applyCommercialUtilityPackComposition({
        client:
          runner() as never,

        packageId:
          state.package.id,

        participantId:
          "different-participant",

        actorUserId:
          "admin-composition-application",
      }),
  );

  assert.equal(
    state.resources.length,
    0,
  );

  assert.ok(
    state.modules.every(
      (module) =>
        module.state ===
          "WITHHELD",
    ),
  );

  console.log(
    "✓ participant mismatch produces no committed composition mutation",
  );
}

async function main() {
  await successSmoke();
  await replaySmoke();
  await rollbackSmoke();
  await participantBindingSmoke();

  console.log(
    "CUP_1F_COMPOSITION_APPLICATION_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
