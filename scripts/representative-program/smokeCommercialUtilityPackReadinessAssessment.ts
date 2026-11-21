import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_READINESS,
  COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  assessCommercialUtilityPackReadinessWithClient,
  type CommercialUtilityPackCompositionPlan,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

const modules = [
  "REPRESENTATION",
  "COMMERCIAL_PARAMETERS",
  "DOCUMENTS",
  "OPERATING_BOUNDARIES",
] as const;

const state = {
  participantId:
    "participant-readiness",

  resources: [
    {
      module:
        "REPRESENTATION",

      resourceType:
        "STRUCTURED_CONTENT",

      resourceId:
        "FW-PROFILE-2026-001",

      state:
        "WITHHELD",
    },

    {
      module:
        "DOCUMENTS",

      resourceType:
        "INSTITUTIONAL_INSTRUMENT",

      resourceId:
        "instrument-ma",

      state:
        "WITHHELD",
    },

    {
      module:
        "OPERATING_BOUNDARIES",

      resourceType:
        "STRUCTURED_CONTENT",

      resourceId:
        "FW-RP-BOUNDARIES-2026-001",

      state:
        "WITHHELD",
    },
  ],
};

const client = {
  commercialUtilityPack: {
    findUnique: async () => ({
      id:
        "cup-readiness",

      participantId:
        state.participantId,

      modules:
        modules.map(
          (module) => ({
            module,
            state:
              "WITHHELD",
          }),
        ),
    }),
  },

  commercialUtilityPackResourceRelease: {
    findMany: async () =>
      state.resources,
  },
};

function basePlan():
  CommercialUtilityPackCompositionPlan {
  return {
    participantId:
      "participant-readiness",

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

function moduleAssessment(
  assessment:
    Awaited<
      ReturnType<
        typeof assessCommercialUtilityPackReadinessWithClient
      >
    >,

  module:
    typeof modules[number],
) {
  const result =
    assessment.modules.find(
      (entry) =>
        entry.module ===
          module,
    );

  assert.ok(
    result,
  );

  return result;
}

async function main() {
  const assessment =
    await assessCommercialUtilityPackReadinessWithClient({
      client:
        client as never,

      packageId:
        "cup-readiness",

      plan:
        basePlan(),
    });

  assert.equal(
    moduleAssessment(
      assessment,
      "REPRESENTATION",
    ).readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .ELIGIBLE,
  );

  assert.equal(
    moduleAssessment(
      assessment,
      "OPERATING_BOUNDARIES",
    ).readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .ELIGIBLE,
  );

  /*
   * Source Authority is conditional.
   *
   * Not selecting it does not make the otherwise-complete Documents
   * module incomplete.
   */
  const documents =
    moduleAssessment(
      assessment,
      "DOCUMENTS",
    );

  assert.equal(
    documents.readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .ELIGIBLE,
  );

  assert.deepEqual(
    documents.nonBlockingUnavailableReasons,
    [
      COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
        .SOURCE_AUTHORITY_NOT_SELECTED,
    ],
  );

  /*
   * Commercial Parameters remain blocked while canonical guidance is
   * not CURRENT.
   */
  const commercial =
    moduleAssessment(
      assessment,
      "COMMERCIAL_PARAMETERS",
    );

  assert.equal(
    commercial.readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .BLOCKED,
  );

  assert.ok(
    commercial.blockers.includes(
      COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
        .REQUIRED_SOURCE_UNAVAILABLE,
    ),
  );

  assert.ok(
    commercial.blockers.includes(
      COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
        .NO_REQUIRED_RESOURCE,
    ),
  );

  console.log(
    "✓ readiness requires current-plan completeness, not merely one resource",
  );

  console.log(
    "✓ unselected Source Authority is conditional and does not block Documents",
  );

  console.log(
    "✓ non-current Commercial Parameters block Commercial Parameters readiness",
  );

  /*
   * Once Source Authority is explicitly selected, it becomes required.
   * If it is absent from CUP persistence, Documents must block.
   */
  const selectedSaiPlan =
    basePlan();

  const selectedEntries =
    selectedSaiPlan.entries.map(
      (entry) => {
        if (
          entry.unavailableReason !==
            COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
              .SOURCE_AUTHORITY_NOT_SELECTED
        ) {
          return entry;
        }

        return {
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
              "SOURCE_AUTHORITY_PRESENTATION",

            sourceId:
              "instrument-sai",

            sourceReference:
              "BAF-SAI-2026-001",

            label:
              "Bafoula Source Authority",
          },

          unavailableReason:
            null,
        } as const;
      },
    );

  const selectedAssessment =
    await assessCommercialUtilityPackReadinessWithClient({
      client:
        client as never,

      packageId:
        "cup-readiness",

      plan: {
        ...selectedSaiPlan,

        entries:
          selectedEntries,
      },
    });

  const selectedDocuments =
    moduleAssessment(
      selectedAssessment,
      "DOCUMENTS",
    );

  assert.equal(
    selectedDocuments.readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .BLOCKED,
  );

  assert.deepEqual(
    selectedDocuments.missingResourceIds,
    [
      "instrument-sai",
    ],
  );

  console.log(
    "✓ selected Source Authority becomes required before Documents READY",
  );

  /*
   * An unplanned current resource must also block readiness. READY is
   * exact plan completeness, not merely plan subset satisfaction.
   */
  state.resources.push({
    module:
      "DOCUMENTS",

    resourceType:
      "DOCUMENT",

    resourceId:
      "unplanned-document",

    state:
      "WITHHELD",
  });

  const unplannedAssessment =
    await assessCommercialUtilityPackReadinessWithClient({
      client:
        client as never,

      packageId:
        "cup-readiness",

      plan:
        basePlan(),
    });

  const unplannedDocuments =
    moduleAssessment(
      unplannedAssessment,
      "DOCUMENTS",
    );

  assert.equal(
    unplannedDocuments.readiness,
    COMMERCIAL_UTILITY_PACK_READINESS
      .BLOCKED,
  );

  assert.deepEqual(
    unplannedDocuments.unplannedResourceIds,
    [
      "unplanned-document",
    ],
  );

  console.log(
    "✓ unplanned current resources block READY eligibility",
  );

  /*
   * Cross-participant assessment fails closed.
   */
  await assert.rejects(
    () =>
      assessCommercialUtilityPackReadinessWithClient({
        client:
          client as never,

        packageId:
          "cup-readiness",

        plan: {
          ...basePlan(),

          participantId:
            "different-participant",
        },
      }),

    /CUP_READINESS_ASSESSMENT_PARTICIPANT_CONTRADICTION/,
  );

  console.log(
    "✓ readiness assessment remains participant-bound",
  );

  console.log(
    "CUP_1F_READINESS_ASSESSMENT_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
