import {
  assertSourceAuthorityPresentationProjection,
  type SourceAuthorityPresentationProjection,
} from "../../src/domains/instruments/source-authority";

const projection:
  SourceAuthorityPresentationProjection = {
    audience: "REPRESENTATIVE",

    identity: {
      sourceAuthorityId:
        "source-authority-1",
      instrumentId:
        "instrument-1",
      instrumentReference:
        "BAF-SAI-2026-001",
      instrumentTitle:
        "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",
      versionId:
        "version-1",
      versionNumber:
        1,

      subject: {
        displayName:
          "Coopérative de Bafoula",
        jurisdiction:
          "Mali",
        institutionalCapacity:
          "Source-side cooperative",
        operatingBase:
          "Bamako, Mali",
        sector:
          "Gold",
        principalCommodityActivity: [
          "Gold",
          "Gold Doré",
        ],
      },
    },

    standing:
      "PARTIALLY_RECOGNIZED",

    assertions: [
      {
        reference:
          "BAF-SAI-2026-001:A001",
        assertionClass:
          "INSTITUTIONAL_IDENTITY",
        title:
          "Institutional identity",
        statement:
          "Institutional identity assertion.",
        scope:
          null,

        transactionAuthorityConferred:
          false,
        sovereignAuthorityConferred:
          false,

        visibleTo: [
          "OPERATOR",
          "RECIPIENT",
          "REPRESENTATIVE",
        ],

        recognition: {
          recognitionId:
            "recognition-1",
          assertionReference:
            "BAF-SAI-2026-001:A001",
          outcome:
            "RECOGNIZED_WITH_LIMITATION",
          evidenceIds: [
            "evidence-1",
          ],
          actorUserId:
            "operator-1",
          actorDisplayName:
            "Institutional Operator",
          occurredAt:
            "2026-10-03T20:00:00.000Z",
          limitation:
            "Registration documentation remains subject to documentary completion.",
          reason:
            null,
          supersedesRecognitionId:
            null,

          transactionAuthorityConferred:
            false,
          sovereignAuthorityConferred:
            false,
        },

        evidence: [
          {
            evidenceId:
              "evidence-1",
            evidenceRole:
              "BAFOULA_SOURCE_PROFILE",
            label:
              "Source Authority Profile",
            reference:
              "BAF-PROFILE-MALI-2026-002",
            admittedAt:
              "2026-10-03T20:00:00.000Z",
            visibleTo: [
              "OPERATOR",
              "RECIPIENT",
              "REPRESENTATIVE",
            ],
          },
        ],

        capabilities: [],
      },
    ],

    evidenceRegister: [
      {
        evidenceId:
          "evidence-1",
        evidenceRole:
          "BAFOULA_SOURCE_PROFILE",
        label:
          "Source Authority Profile",
        reference:
          "BAF-PROFILE-MALI-2026-002",
        admittedAt:
          "2026-10-03T20:00:00.000Z",
        visibleTo: [
          "OPERATOR",
          "RECIPIENT",
          "REPRESENTATIVE",
        ],
      },
    ],

    capabilities: [],

    operatorRecord: [],

    boundary: {
      sovereignAuthorityEstablished:
        false,
      regulatoryApprovalEstablished:
        false,
      exportAuthorizationEstablished:
        false,
      commodityAvailabilityEstablished:
        false,
      commodityAllocationEstablished:
        false,
      titleEstablished:
        false,
      transactionAuthorityConferred:
        false,
      settlementAuthorityConferred:
        false,

      statement:
        "This Source Authority presentation records institutional assertions, documentary evidence, capabilities, and operator recognition. It does not itself establish sovereign State authority, regulatory approval, export authorization, commodity availability or allocation, title, transaction authority, or settlement authority.",
    },
  };

assertSourceAuthorityPresentationProjection(
  projection,
);

const withoutEvidence:
  SourceAuthorityPresentationProjection = {
    ...projection,

    assertions: [
      {
        ...projection.assertions[0],

        recognition: {
          ...projection.assertions[0]
            .recognition!,

          evidenceIds: [],
        },
      },
    ],
  };

let evidenceRequired = false;

try {
  assertSourceAuthorityPresentationProjection(
    withoutEvidence,
  );
} catch (error) {
  evidenceRequired =
    error instanceof Error &&
    error.message ===
      "SOURCE_AUTHORITY_PRESENTATION_RECOGNITION_EVIDENCE_REQUIRED";
}

if (!evidenceRequired) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_SMOKE_EXPECTED_EVIDENCE_GATE",
  );
}

const badBoundary =
  {
    ...projection,

    boundary: {
      ...projection.boundary,

      transactionAuthorityConferred:
        true,
    },
  } as unknown as
    SourceAuthorityPresentationProjection;

let boundaryBlocked = false;

try {
  assertSourceAuthorityPresentationProjection(
    badBoundary,
  );
} catch (error) {
  boundaryBlocked =
    error instanceof Error &&
    error.message ===
      "SOURCE_AUTHORITY_PRESENTATION_BOUNDARY_VIOLATION";
}

if (!boundaryBlocked) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_SMOKE_EXPECTED_BOUNDARY_GATE",
  );
}

console.log(
  "SOURCE_AUTHORITY_PRESENTATION_CONTRACT_OK",
);

console.log({
  audiences: [
    "OPERATOR",
    "RECIPIENT",
    "REPRESENTATIVE",
  ],

  evidenceSeparateFromRecognition:
    true,

  recognitionAssertionScoped:
    true,

  presentationStandingDerived:
    true,

  transactionAuthorityConferred:
    false,

  sovereignAuthorityEstablished:
    false,

  settlementAuthorityConferred:
    false,
});
