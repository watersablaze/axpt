import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_READINESS,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  markCommercialUtilityPackModuleReadyWithClient,
  type CommercialUtilityPackCompositionPlan,
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

const state = {
  pack: {
    id:
      "cup-readiness-application",

    participantId:
      "participant-readiness-application",

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
        "cup-readiness-application",

      module:
        "REPRESENTATION",

      state:
        "WITHHELD" as ModuleState,

      releasedByUserId:
        null as string | null,

      releasedAt:
        null as Date | null,
    },

    {
      id:
        "module-commercial",

      packageId:
        "cup-readiness-application",

      module:
        "COMMERCIAL_PARAMETERS",

      state:
        "WITHHELD" as ModuleState,

      releasedByUserId:
        null as string | null,

      releasedAt:
        null as Date | null,
    },

    {
      id:
        "module-documents",

      packageId:
        "cup-readiness-application",

      module:
        "DOCUMENTS",

      state:
        "WITHHELD" as ModuleState,

      releasedByUserId:
        null as string | null,

      releasedAt:
        null as Date | null,
    },

    {
      id:
        "module-boundaries",

      packageId:
        "cup-readiness-application",

      module:
        "OPERATING_BOUNDARIES",

      state:
        "WITHHELD" as ModuleState,

      releasedByUserId:
        null as string | null,

      releasedAt:
        null as Date | null,
    },
  ],

  resources: [
    {
      id:
        "resource-profile",

      packageId:
        "cup-readiness-application",

      module:
        "REPRESENTATION",

      resourceType:
        "STRUCTURED_CONTENT",

      resourceId:
        "FW-PROFILE-2026-001",

      state:
        "WITHHELD" as ResourceState,
    },

    {
      id:
        "resource-ma",

      packageId:
        "cup-readiness-application",

      module:
        "DOCUMENTS",

      resourceType:
        "INSTITUTIONAL_INSTRUMENT",

      resourceId:
        "instrument-ma",

      state:
        "WITHHELD" as ResourceState,
    },

    {
      id:
        "resource-boundaries",

      packageId:
        "cup-readiness-application",

      module:
        "OPERATING_BOUNDARIES",

      resourceType:
        "STRUCTURED_CONTENT",

      resourceId:
        "FW-RP-BOUNDARIES-2026-001",

      state:
        "WITHHELD" as ResourceState,
    },
  ],

  events: [] as Array<{
    eventType: string;
    payload: unknown;
  }>,
};

const client = {
  user: {
    findUnique: async () => ({
      isAdmin:
        true,
    }),
  },

  commercialUtilityPack: {
    findUnique: async (
      args: any,
    ) => {
      if (args.select?.participantId) {
        return {
          id:
            state.pack.id,

          participantId:
            state.pack.participantId,

          modules:
            state.modules.map(
              (module) => ({
                module:
                  module.module,

                state:
                  module.state,
              }),
            ),
        };
      }

      if (args.select?.state) {
        return {
          id:
            state.pack.id,

          state:
            state.pack.state,
        };
      }

      return {
        ...state.pack,
      };
    },
  },

  commercialUtilityPackModuleRelease: {
    findUnique: async (
      args: any,
    ) => {
      if (args.where?.packageId_module) {
        const key =
          args.where.packageId_module;

        return (
          state.modules.find(
            (module) =>
              module.packageId ===
                key.packageId &&
              module.module ===
                key.module,
          ) ?? null
        );
      }

      if (args.where?.id) {
        return (
          state.modules.find(
            (module) =>
              module.id ===
                args.where.id,
          ) ?? null
        );
      }

      return null;
    },

    updateMany: async (
      args: any,
    ) => {
      const module =
        state.modules.find(
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

  commercialUtilityPackResourceRelease: {
    findMany: async (
      args: any,
    ) => {
      const module =
        args.where?.module;

      if (module) {
        return state.resources
          .filter(
            (resource) =>
              resource.packageId ===
                args.where.packageId &&
              resource.module ===
                module &&
              (
                resource.state ===
                  "WITHHELD" ||
                resource.state ===
                  "RELEASED"
              ),
          )
          .map(
            (resource) => ({
              id:
                resource.id,

              state:
                resource.state,
            }),
          );
      }

      return state.resources
        .filter(
          (resource) =>
            resource.packageId ===
              args.where.packageId &&
            (
              resource.state ===
                "WITHHELD" ||
              resource.state ===
                "RELEASED"
            ),
        )
        .map(
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
  },

  domainEvent: {
    create: async (
      args: any,
    ) => {
      state.events.push({
        eventType:
          args.data.eventType,

        payload:
          args.data.payload,
      });

      return {
        id:
          `event-${state.events.length}`,
      };
    },
  },
};

function plan():
  CommercialUtilityPackCompositionPlan {
  return {
    participantId:
      state.pack.participantId,

    entries: [
      {
        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .REPRESENTATION,

        availability:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .AVAILABLE,

        descriptor: {
          module:
            COMMERCIAL_UTILITY_PACK_MODULE
              .REPRESENTATION,

          resourceType:
            COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
              .STRUCTURED_CONTENT,

          sourceKind:
            "STRUCTURED_PROJECTION",

          projectionKey:
            "FRENCH_WARD_INSTITUTIONAL_PROFILE",

          sourceId:
            "FW-PROFILE-2026-001",

          sourceReference:
            "FW-PROFILE-2026-001",

          label:
            "French-Ward Institutional Profile",
        },

        unavailableReason:
          null,
      },

      {
        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .DOCUMENTS,

        availability:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .AVAILABLE,

        descriptor: {
          module:
            COMMERCIAL_UTILITY_PACK_MODULE
              .DOCUMENTS,

          resourceType:
            COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
              .INSTITUTIONAL_INSTRUMENT,

          sourceKind:
            "INSTITUTIONAL_INSTRUMENT",

          projectionKey:
            "REPRESENTATIVE_MASTER_AGREEMENT",

          sourceId:
            "instrument-ma",

          sourceReference:
            "FWI-26-RP-001-MA",

          label:
            "Representative Program Master Agreement",
        },

        unavailableReason:
          null,
      },

      {
        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .DOCUMENTS,

        availability:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .UNAVAILABLE,

        descriptor:
          null,

        unavailableReason:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
            .SOURCE_AUTHORITY_NOT_SELECTED,
      },

      {
        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .COMMERCIAL_PARAMETERS,

        availability:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .UNAVAILABLE,

        descriptor:
          null,

        unavailableReason:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
            .COMMERCIAL_PARAMETERS_NOT_CURRENT,
      },

      {
        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .OPERATING_BOUNDARIES,

        availability:
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .AVAILABLE,

        descriptor: {
          module:
            COMMERCIAL_UTILITY_PACK_MODULE
              .OPERATING_BOUNDARIES,

          resourceType:
            COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
              .STRUCTURED_CONTENT,

          sourceKind:
            "STRUCTURED_PROJECTION",

          projectionKey:
            "OPERATING_BOUNDARIES",

          sourceId:
            "FW-RP-BOUNDARIES-2026-001",

          sourceReference:
            "FW-RP-BOUNDARIES-2026-001",

          label:
            "Representative Operating Boundaries",
        },

        unavailableReason:
          null,
      },
    ],

    availableDescriptors:
      [],
  };
}

async function main() {
  const resourceSnapshot =
    JSON.stringify(
      state.resources,
    );

  /*
   * Eligible module moves exactly once.
   */
  const first =
    await markCommercialUtilityPackModuleReadyWithClient({
      client:
        client as never,

      packageId:
        state.pack.id,

      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .REPRESENTATION,

      plan:
        plan(),

      actorUserId:
        "admin-ready",
    });

  assert.equal(
    first.assessment.readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .ELIGIBLE,
  );

  assert.equal(
    first.transitioned,
    true,
  );

  assert.equal(
    state.modules.find(
      (module) =>
        module.module ===
          "REPRESENTATION",
    )?.state,
    "READY",
  );

  assert.equal(
    JSON.stringify(
      state.resources,
    ),
    resourceSnapshot,
  );

  console.log(
    "✓ eligible module transitions WITHHELD → READY",
  );

  console.log(
    "✓ readiness application does not mutate resource state",
  );

  /*
   * Exact replay is idempotent through the canonical transition command.
   */
  const replay =
    await markCommercialUtilityPackModuleReadyWithClient({
      client:
        client as never,

      packageId:
        state.pack.id,

      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .REPRESENTATION,

      plan:
        plan(),

      actorUserId:
        "admin-ready",
    });

  assert.equal(
    replay.transitioned,
    false,
  );

  assert.equal(
    state.events.length,
    1,
  );

  console.log(
    "✓ exact READY replay is idempotent",
  );

  /*
   * Commercial Parameters are composition-blocked and may not transition.
   */
  const commercialBefore =
    state.modules.find(
      (module) =>
        module.module ===
          "COMMERCIAL_PARAMETERS",
    )?.state;

  await assert.rejects(
    () =>
      markCommercialUtilityPackModuleReadyWithClient({
        client:
          client as never,

        packageId:
          state.pack.id,

        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .COMMERCIAL_PARAMETERS,

        plan:
          plan(),

        actorUserId:
          "admin-ready",
      }),

    /CUP_READINESS_APPLICATION_MODULE_BLOCKED/,
  );

  assert.equal(
    state.modules.find(
      (module) =>
        module.module ===
          "COMMERCIAL_PARAMETERS",
    )?.state,
    commercialBefore,
  );

  assert.equal(
    state.events.length,
    1,
  );

  console.log(
    "✓ blocked module cannot enter READY",
  );

  /*
   * Documents are eligible even with unselected conditional Source Authority.
   */
  const documents =
    await markCommercialUtilityPackModuleReadyWithClient({
      client:
        client as never,

      packageId:
        state.pack.id,

      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      plan:
        plan(),

      actorUserId:
        "admin-ready",
    });

  assert.equal(
    documents.transitioned,
    true,
  );

  assert.equal(
    state.modules.find(
      (module) =>
        module.module ===
          "DOCUMENTS",
    )?.state,
    "READY",
  );

  console.log(
    "✓ Documents may enter READY with MA complete and Source Authority unselected",
  );

  assert.equal(
    state.pack.releaseState,
    "WITHHELD",
  );

  assert.equal(
    state.pack.state,
    "PREPARING",
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.state ===
          "WITHHELD",
    ),
  );

  console.log(
    "✓ READY application does not release resources or reconcile package",
  );

  console.log(
    "CUP_1F_READINESS_APPLICATION_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
