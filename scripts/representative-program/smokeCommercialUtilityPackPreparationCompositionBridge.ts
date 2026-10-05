import assert from "node:assert/strict";

import {
  prepareAndApplyCommercialUtilityPackComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

import {
  COMMERCIAL_UTILITY_PACK_MODULES,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/contracts";

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

type PackRecord = {
  id: string;
  reference: string;
  participantId: string;
  version: number;
  state: string;
  releaseState: string;
  audience: string;
  createdByUserId: string;
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

    package:
      null as PackRecord | null,

    modules:
      [] as ModuleRecord[],

    resources:
      [] as ResourceRecord[],

    events:
      [] as EventRecord[],

    nextResource:
      1,

    failCompositionOnDocuments:
      false,
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

function participantProjection(
  args: any,
) {
  /*
   * Creation projection.
   */
  if (
    args.select?.docketReference ||
    args.select?.standing
  ) {
    return {
      id:
        "participant-bridge",

      docketReference:
        "FWI-26-RP-100",

      standing:
        "PROVISIONAL",
    };
  }

  /*
   * Composition Master Agreement projection.
   */
  return {
    id:
      "participant-bridge",

    onboardingIntake: {
      masterAgreementInstrumentId:
        "instrument-ma-bridge",

      masterAgreementInstrument: {
        id:
          "instrument-ma-bridge",

        reference:
          "FWI-26-RP-100-MA",

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

function transactionClient(
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
          if (
            args.where?.id !==
              "participant-bridge"
          ) {
            return null;
          }

          return participantProjection(
            args,
          );
        },
    },

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
          if (!draft.package) {
            return null;
          }

          /*
           * Creation semantic replay lookup.
           */
          const participantVersion =
            args.where
              ?.participantId_version;

          if (participantVersion) {
            if (
              draft.package.participantId !==
                participantVersion.participantId ||
              draft.package.version !==
                participantVersion.version
            ) {
              return null;
            }

            return {
              ...draft.package,

              modules:
                draft.modules.map(
                  (module) => ({
                    module:
                      module.module,

                    state:
                      module.state,
                  }),
                ),
            };
          }

          /*
           * Creation reference ownership lookup.
           */
          if (
            args.where?.reference
          ) {
            if (
              draft.package.reference !==
                args.where.reference
            ) {
              return null;
            }

            return {
              id:
                draft.package.id,

              participantId:
                draft.package.participantId,

              version:
                draft.package.version,
            };
          }

          /*
           * Composition package lookup.
           */
          if (
            args.where?.id !==
              draft.package.id
          ) {
            return null;
          }

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
            args.select?.state
          ) {
            return {
              id:
                draft.package.id,

              state:
                draft.package.state,
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
        },

      create:
        async (
          args: any,
        ) => {
          const id =
            "cup-bridge-001";

          draft.package = {
            id,

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
          };

          draft.modules =
            args.data.modules.create.map(
              (
                module:
                  {
                    module:
                      ModuleRecord["module"];

                    state:
                      ModuleState;
                  },
                index:
                  number,
              ) => ({
                id:
                  `module-${index + 1}`,

                packageId:
                  id,

                module:
                  module.module,

                state:
                  module.state,

                releasedByUserId:
                  null,

                releasedAt:
                  null,
              }),
            );

          return {
            ...draft.package,

            modules:
              draft.modules,
          };
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
            draft.failCompositionOnDocuments &&
            eventType ===
              "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED" &&
            module ===
              "DOCUMENTS"
          ) {
            throw new Error(
              "SIMULATED_BRIDGE_COMPOSITION_FAILURE",
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
              transactionClient(
                draft,
              ),
            );

          state =
            draft;

          return result;
        } catch (error) {
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
    await prepareAndApplyCommercialUtilityPackComposition({
      client:
        runner() as never,

      participantId:
        "participant-bridge",

      actorUserId:
        "admin-bridge",

      occurredAt:
        new Date(
          "2026-10-05T18:30:00.000Z",
        ),
    });

  assert.equal(
    state.transactionCount,
    2,
    "prepare + compose must use two transaction boundaries",
  );

  assert.equal(
    result.packageCreated,
    true,
  );

  assert.equal(
    result.package.id,
    "cup-bridge-001",
  );

  assert.equal(
    result.reference,
    "FWI-26-RP-100-CUP-001",
  );

  assert.equal(
    state.resources.length,
    3,
  );

  assert.deepEqual(
    result.composition.eligibleModules,
    [
      "REPRESENTATION",
      "DOCUMENTS",
      "OPERATING_BOUNDARIES",
    ],
  );

  assert.deepEqual(
    result.composition.blockedModules,
    [
      "COMMERCIAL_PARAMETERS",
    ],
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
        (entry) =>
          entry.module ===
            module,
      )?.state,
      "READY",
    );
  }

  assert.equal(
    state.modules.find(
      (entry) =>
        entry.module ===
          "COMMERCIAL_PARAMETERS",
    )?.state,
    "WITHHELD",
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.state ===
          "WITHHELD",
    ),
  );

  console.log(
    "✓ bridge uses one preparation transaction then one composition transaction",
  );

  console.log(
    "✓ newly prepared CUP receives current governed composition",
  );

  console.log(
    "✓ blocked Commercial Parameters remain non-failing",
  );
}

async function replaySmoke() {
  const transactionsBefore =
    state.transactionCount;

  const resourcesBefore =
    state.resources.length;

  const eventsBefore =
    state.events.length;

  const result =
    await prepareAndApplyCommercialUtilityPackComposition({
      client:
        runner() as never,

      participantId:
        "participant-bridge",

      actorUserId:
        "admin-bridge",
    });

  assert.equal(
    state.transactionCount -
      transactionsBefore,
    2,
  );

  assert.equal(
    result.packageCreated,
    false,
  );

  assert.equal(
    result.package.id,
    "cup-bridge-001",
  );

  assert.equal(
    state.resources.length,
    resourcesBefore,
  );

  assert.equal(
    state.events.length,
    eventsBefore,
  );

  assert.ok(
    result.composition.registration.registered.every(
      (entry) =>
        entry.created ===
          false,
    ),
  );

  assert.ok(
    result.composition.readinessApplications.every(
      (entry) =>
        entry.transitioned ===
          false,
    ),
  );

  console.log(
    "✓ exact bridge replay resolves existing CUP without duplicate resources",
  );

  console.log(
    "✓ exact bridge replay creates no duplicate READY events",
  );
}

async function compositionFailureSmoke() {
  state =
    initialState();

  state.failCompositionOnDocuments =
    true;

  await assert.rejects(
    () =>
      prepareAndApplyCommercialUtilityPackComposition({
        client:
          runner() as never,

        participantId:
          "participant-bridge",

        actorUserId:
          "admin-bridge",
      }),

    /SIMULATED_BRIDGE_COMPOSITION_FAILURE/,
  );

  /*
   * Preparation committed in transaction A.
   */
  assert.ok(
    state.package,
  );

  assert.equal(
    state.package?.state,
    "PREPARING",
  );

  assert.equal(
    state.package?.releaseState,
    "WITHHELD",
  );

  assert.equal(
    state.modules.length,
    COMMERCIAL_UTILITY_PACK_MODULES.length,
  );

  assert.ok(
    state.modules.every(
      (module) =>
        module.state ===
          "WITHHELD",
    ),
  );

  /*
   * Composition transaction B rolled back in full.
   */
  assert.equal(
    state.resources.length,
    0,
  );

  assert.equal(
    state.events.filter(
      (event) =>
        event.eventType ===
          "COMMERCIAL_UTILITY_PACK_CREATED",
    ).length,
    1,
  );

  assert.equal(
    state.events.filter(
      (event) =>
        event.eventType ===
          "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED",
    ).length,
    0,
  );

  assert.equal(
    state.transactionCount,
    2,
  );

  console.log(
    "✓ composition failure does not roll back committed package preparation",
  );

  console.log(
    "✓ failed composition transaction leaves no resources or READY transitions",
  );

  console.log(
    "✓ prepared package remains recoverable in PREPARING / WITHHELD state",
  );
}

async function main() {
  await successSmoke();
  await replaySmoke();
  await compositionFailureSmoke();

  console.log(
    "CUP_1F_PREPARE_COMPOSE_BRIDGE_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
