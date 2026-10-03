import {
  deriveSourceAuthorityPresentation,
  type CanonicalSourceAuthorityPresentationState,
} from "../../src/domains/instruments/source-authority";

const canonical:
  CanonicalSourceAuthorityPresentationState = {
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

    evidence: [
      {
        evidenceId:
          "evidence-profile",

        evidenceRole:
          "BAFOULA_SOURCE_PROFILE",

        label:
          "Source Authority Profile",

        reference:
          "BAF-PROFILE-MALI-2026-002",

        admittedAt:
          "2026-10-03T20:00:00.000Z",
      },
    ],

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

        evidenceIds: [
          "evidence-profile",
        ],

        capabilities: [],

        currentRecognition: {
          recognitionId:
            "recognition-a001",

          assertionReference:
            "BAF-SAI-2026-001:A001",

          outcome:
            "RECOGNIZED_WITH_LIMITATION",

          evidenceIds: [
            "evidence-profile",
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

          supersededByRecognitionId:
            null,
        },
      },

      {
        reference:
          "BAF-SAI-2026-001:A003",

        assertionClass:
          "OPERATIONAL_CAPABILITY",

        title:
          "Operational capability",

        statement:
          "Operational capability assertion.",

        scope:
          null,

        evidenceIds: [
          "evidence-profile",
        ],

        capabilities: [
          {
            capabilityKey:
              "MINERAL_PRODUCTION_AGGREGATION",

            title:
              "Mineral production aggregation",

            description:
              "Source-side mineral production aggregation.",

            assertionReference:
              "BAF-SAI-2026-001:A003",
          },
        ],

        currentRecognition: {
          recognitionId:
            "recognition-a003",

          assertionReference:
            "BAF-SAI-2026-001:A003",

          outcome:
            "RECOGNIZED_WITH_LIMITATION",

          evidenceIds: [
            "evidence-profile",
          ],

          actorUserId:
            "operator-1",

          actorDisplayName:
            "Institutional Operator",

          occurredAt:
            "2026-10-03T20:01:00.000Z",

          limitation:
            "Capability does not establish current commodity availability.",

          reason:
            null,

          supersedesRecognitionId:
            null,

          supersededByRecognitionId:
            null,
        },
      },

      {
        reference:
          "BAF-SAI-2026-001:A006",

        assertionClass:
          "INSTRUMENT_BOUNDARY",

        title:
          "Instrument boundary",

        statement:
          "Internal authority-boundary assertion.",

        scope:
          null,

        evidenceIds: [],

        capabilities: [],

        currentRecognition:
          null,
      },
    ],

    recognitionHistory: [
      {
        recognitionId:
          "recognition-a001",

        assertionReference:
          "BAF-SAI-2026-001:A001",

        outcome:
          "RECOGNIZED_WITH_LIMITATION",

        evidenceIds: [
          "evidence-profile",
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

        supersededByRecognitionId:
          null,
      },

      {
        recognitionId:
          "recognition-a003",

        assertionReference:
          "BAF-SAI-2026-001:A003",

        outcome:
          "RECOGNIZED_WITH_LIMITATION",

        evidenceIds: [
          "evidence-profile",
        ],

        actorUserId:
          "operator-1",

        actorDisplayName:
          "Institutional Operator",

        occurredAt:
          "2026-10-03T20:01:00.000Z",

        limitation:
          "Capability does not establish current commodity availability.",

        reason:
          null,

        supersedesRecognitionId:
          null,

        supersededByRecognitionId:
          null,
      },
    ],
  };

const operator =
  deriveSourceAuthorityPresentation({
    audience:
      "OPERATOR",

    canonical,
  });

const recipient =
  deriveSourceAuthorityPresentation({
    audience:
      "RECIPIENT",

    canonical,
  });

const representative =
  deriveSourceAuthorityPresentation({
    audience:
      "REPRESENTATIVE",

    canonical,
  });

if (
  operator.assertions.length !== 3
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_OPERATOR_ASSERTION_SCOPE_FAILED",
  );
}

if (
  recipient.assertions.length !== 2 ||
  representative.assertions.length !== 2
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_EXTERNAL_ASSERTION_SCOPE_FAILED",
  );
}

if (
  operator.operatorRecord.length !== 2
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_OPERATOR_HISTORY_MISSING",
  );
}

if (
  recipient.operatorRecord.length !== 0 ||
  representative.operatorRecord.length !== 0
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_EXTERNAL_HISTORY_LEAK",
  );
}

if (
  recipient.assertions.some(
    (assertion) =>
      assertion.recognition
        ?.actorUserId !== null ||
      assertion.recognition
        ?.actorDisplayName !== null,
  )
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_RECIPIENT_OPERATOR_IDENTITY_LEAK",
  );
}

if (
  representative.assertions.some(
    (assertion) =>
      assertion.recognition
        ?.supersedesRecognitionId !== null,
  )
) {
  throw new Error(
    "SOURCE_AUTHORITY_PRESENTATION_REPRESENTATIVE_HISTORY_LEAK",
  );
}

for (
  const projection
  of [
    operator,
    recipient,
    representative,
  ]
) {
  if (
    projection.boundary
      .transactionAuthorityConferred !==
      false ||
    projection.boundary
      .sovereignAuthorityEstablished !==
      false ||
    projection.boundary
      .settlementAuthorityConferred !==
      false
  ) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_DERIVATION_AUTHORITY_LEAK",
    );
  }

  if (
    projection.capabilities.some(
      (capability) =>
        capability
          .currentCommodityAvailabilityEstablished !==
          false ||
        capability
          .transactionAuthorityConferred !==
          false,
    )
  ) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_DERIVATION_CAPABILITY_AUTHORITY_LEAK",
    );
  }
}

console.log(
  "SOURCE_AUTHORITY_PRESENTATION_DERIVATION_OK",
);

console.log({
  operatorAssertions:
    operator.assertions.length,

  recipientAssertions:
    recipient.assertions.length,

  representativeAssertions:
    representative.assertions.length,

  operatorHistory:
    operator.operatorRecord.length,

  recipientHistory:
    recipient.operatorRecord.length,

  representativeHistory:
    representative.operatorRecord.length,

  operatorStanding:
    operator.standing,

  recipientStanding:
    recipient.standing,

  representativeStanding:
    representative.standing,

  transactionAuthorityConferred:
    false,

  sovereignAuthorityEstablished:
    false,

  settlementAuthorityConferred:
    false,
});
