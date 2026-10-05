import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON,
  COMMERCIAL_UTILITY_PACK_MODULE,
  resolveCommercialUtilityPackCompositionPlanWithClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function mainClient() {
  return {
    representativeProgramParticipant: {
      findUnique: async () => ({
        id:
          "participant-cup-plan",

        onboardingIntake: {
          masterAgreementInstrumentId:
            "instrument-ma-001",

          masterAgreementInstrument: {
            id:
              "instrument-ma-001",

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
      }),
    },

    sourceAuthority: {
      findUnique: async () => ({
        id:
          "source-authority-bafoula",
      }),
    },

    institutionalInstrument: {
      findUnique: async () => ({
        id:
          "instrument-sai-001",
      }),
    },

    institutionalInstrumentVersion: {
      findFirst: async () => ({
        id:
          "version-sai-001",

        versionNumber:
          1,

        state:
          "ISSUED",

        payload: {},
      }),
    },

    sourceAuthorityProfileParticular: {
      findMany: async () => [],
    },

    instrumentAssertion: {
      findMany: async () => [],
    },

    instrumentEvidence: {
      findMany: async () => [],
    },

    instrumentAuthority: {
      findMany: async () => [],
    },

    instrumentRecognition: {
      findFirst: async () => null,
    },
  };
}

async function main() {
  /*
   * First prove the expected current architecture without selecting
   * Source Authority.
   *
   * Commercial Parameters are PREPARING and therefore unavailable.
   */
  const client =
    mainClient();

  /*
   * Source Authority loader has a richer persistence contract.
   * This smoke intentionally avoids invoking it by leaving the
   * instrument reference absent.
   */
  const plan =
    await resolveCommercialUtilityPackCompositionPlanWithClient({
      client:
        client as never,

      participantId:
        "participant-cup-plan",
    });

  assert.equal(
    plan.participantId,
    "participant-cup-plan",
  );

  const representation =
    plan.entries.find(
      (entry) =>
        entry.module ===
          COMMERCIAL_UTILITY_PACK_MODULE
            .REPRESENTATION,
    );

  assert.equal(
    representation?.availability,
    COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
      .AVAILABLE,
  );

  const commercialParameters =
    plan.entries.find(
      (entry) =>
        entry.module ===
          COMMERCIAL_UTILITY_PACK_MODULE
            .COMMERCIAL_PARAMETERS,
    );

  assert.equal(
    commercialParameters?.availability,
    COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
      .UNAVAILABLE,
  );

  assert.equal(
    commercialParameters?.unavailableReason,
    COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
      .COMMERCIAL_PARAMETERS_NOT_CURRENT,
  );

  const sourceAuthority =
    plan.entries.find(
      (entry) =>
        entry.module ===
          COMMERCIAL_UTILITY_PACK_MODULE
            .DOCUMENTS &&
        entry.unavailableReason ===
          COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
            .SOURCE_AUTHORITY_NOT_SELECTED,
    );

  assert.ok(
    sourceAuthority,
  );

  const masterAgreement =
    plan.availableDescriptors.find(
      (descriptor) =>
        descriptor.projectionKey ===
          "REPRESENTATIVE_MASTER_AGREEMENT",
    );

  assert.ok(
    masterAgreement,
  );

  const operatingBoundaries =
    plan.availableDescriptors.find(
      (descriptor) =>
        descriptor.projectionKey ===
          "OPERATING_BOUNDARIES",
    );

  assert.ok(
    operatingBoundaries,
  );

  const institutionalProfile =
    plan.availableDescriptors.find(
      (descriptor) =>
        descriptor.projectionKey ===
          "FRENCH_WARD_INSTITUTIONAL_PROFILE",
    );

  assert.ok(
    institutionalProfile,
  );

  assert.equal(
    plan.availableDescriptors.some(
      (descriptor) =>
        descriptor.projectionKey ===
          "COMMERCIAL_PARAMETERS",
    ),
    false,
  );

  assert.equal(
    plan.availableDescriptors.some(
      (descriptor) =>
        descriptor.projectionKey ===
          "SOURCE_AUTHORITY_PRESENTATION",
    ),
    false,
  );

  console.log(
    "✓ composition plan resolves available canonical sources",
  );

  console.log(
    "✓ PREPARING Commercial Parameters remain unavailable without failing plan",
  );

  console.log(
    "✓ unselected Source Authority remains unavailable rather than guessed",
  );

  console.log(
    "✓ Master Agreement, Institutional Profile, and Operating Boundaries remain composable",
  );

  console.log(
    "✓ composition plan performs no CUP resource or release mutation",
  );

  console.log(
    "CUP_1F_COMPOSITION_PLAN_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
