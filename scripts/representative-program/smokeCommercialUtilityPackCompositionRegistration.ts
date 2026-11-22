import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  registerCommercialUtilityPackCompositionPlanWithClient,
  type CommercialUtilityPackCompositionPlan,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

type Resource = {
  id: string;
  packageId: string;
  module: string;
  resourceType: string;
  resourceId: string;
  state: string;
  label: string | null;
  canView: boolean;
  canDownload: boolean;
  canPresent: boolean;
  canTransmit: boolean;
};

const state = {
  resources: [] as Resource[],

  modules: [
    {
      id:
        "module-representation",
      module:
        "REPRESENTATION",
      state:
        "WITHHELD",
    },
    {
      id:
        "module-commercial",
      module:
        "COMMERCIAL_PARAMETERS",
      state:
        "WITHHELD",
    },
    {
      id:
        "module-documents",
      module:
        "DOCUMENTS",
      state:
        "WITHHELD",
    },
    {
      id:
        "module-boundaries",
      module:
        "OPERATING_BOUNDARIES",
      state:
        "WITHHELD",
    },
  ],
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
            "cup-plan-registration-001",

          participantId:
            "participant-plan-registration",
        };
      }

      const moduleWhere =
        args.include?.modules?.where?.module;

      return {
        id:
          "cup-plan-registration-001",

        participantId:
          "participant-plan-registration",

        modules:
          state.modules
            .filter(
              (entry) =>
                entry.module ===
                moduleWhere,
            )
            .map((entry) => ({
              id:
                entry.id,

              state:
                entry.state,
            })),
      };
    },
  },

  commercialUtilityPackResourceRelease: {
    findUnique: async (
      args: any,
    ) => {
      const key =
        args.where
          .packageId_module_resourceType_resourceId;

      return (
        state.resources.find(
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

    create: async (
      args: any,
    ) => {
      const resource: Resource = {
        id:
          `resource-${state.resources.length + 1}`,

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

      state.resources.push(
        resource,
      );

      return resource;
    },
  },
};

function plan():
  CommercialUtilityPackCompositionPlan {
  return {
    participantId:
      "participant-plan-registration",

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
            "instrument-master-agreement",

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

    availableDescriptors: [],
  };
}

async function main() {
  const first =
    await registerCommercialUtilityPackCompositionPlanWithClient({
      client:
        client as never,

      packageId:
        "cup-plan-registration-001",

      plan:
        plan(),

      actorUserId:
        "admin-plan-registration",
    });

  assert.equal(
    first.registered.length,
    3,
  );

  assert.equal(
    first.unavailableCount,
    2,
  );

  assert.equal(
    state.resources.length,
    3,
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.state ===
          COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
            .WITHHELD,
    ),
  );

  assert.ok(
    state.resources.every(
      (resource) =>
        resource.canView === true &&
        resource.canDownload === false &&
        resource.canPresent === false &&
        resource.canTransmit === false,
    ),
  );

  assert.equal(
    state.resources.some(
      (resource) =>
        resource.module ===
          COMMERCIAL_UTILITY_PACK_MODULE
            .COMMERCIAL_PARAMETERS,
    ),
    false,
  );

  console.log(
    "✓ AVAILABLE descriptors register as WITHHELD CUP resources",
  );

  console.log(
    "✓ UNAVAILABLE plan entries do not register resources",
  );

  console.log(
    "✓ registration grants view only; present/transmit/download remain withheld",
  );

  const replay =
    await registerCommercialUtilityPackCompositionPlanWithClient({
      client:
        client as never,

      packageId:
        "cup-plan-registration-001",

      plan:
        plan(),

      actorUserId:
        "admin-plan-registration",
    });

  assert.equal(
    replay.registered.length,
    3,
  );

  assert.ok(
    replay.registered.every(
      (entry) =>
        entry.created === false,
    ),
  );

  assert.equal(
    state.resources.length,
    3,
  );

  console.log(
    "✓ exact registration replay is idempotent",
  );

  /*
   * Registration must not alter module state.
   */
  assert.ok(
    state.modules.every(
      (module) =>
        module.state ===
          "WITHHELD",
    ),
  );

  console.log(
    "✓ registration does not transition modules",
  );

  /*
   * A plan cannot cross the participant/package boundary.
   */
  const crossParticipantPlan = {
    ...plan(),

    participantId:
      "different-participant",
  };

  await assert.rejects(
    () =>
      registerCommercialUtilityPackCompositionPlanWithClient({
        client:
          client as never,

        packageId:
          "cup-plan-registration-001",

        plan:
          crossParticipantPlan,

        actorUserId:
          "admin-plan-registration",
      }),

    /CUP_COMPOSITION_REGISTRATION_PARTICIPANT_CONTRADICTION/,
  );

  assert.equal(
    state.resources.length,
    3,
  );

  console.log(
    "✓ participant plan cannot register into another participant CUP",
  );

  /*
   * Malformed UNAVAILABLE entries must fail before mutation.
   */
  const malformed =
    plan();

  const malformedEntries =
    [...malformed.entries];

  malformedEntries[2] = {
    ...malformedEntries[2],

    descriptor:
      malformedEntries[0]
        ?.descriptor ?? null,
  };

  const resourceCountBeforeMalformed =
    state.resources.length;

  await assert.rejects(
    () =>
      registerCommercialUtilityPackCompositionPlanWithClient({
        client:
          client as never,

        packageId:
          "cup-plan-registration-001",

        plan: {
          ...malformed,
          entries:
            malformedEntries,
        },

        actorUserId:
          "admin-plan-registration",
      }),

    /CUP_COMPOSITION_REGISTRATION_UNAVAILABLE_ENTRY_CONTRADICTION/,
  );

  assert.equal(
    state.resources.length,
    resourceCountBeforeMalformed,
  );

  console.log(
    "✓ contradictory unavailable entries reject before mutation",
  );

  console.log(
    "CUP_1F_COMPOSITION_REGISTRATION_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
