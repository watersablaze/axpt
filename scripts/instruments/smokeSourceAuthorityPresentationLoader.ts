import assert from "node:assert/strict";

import {
  deriveSourceAuthorityPresentation,
  loadSourceAuthorityCanonicalStateWithClient,
  type SourceAuthorityPresentationLoaderClient,
} from "../../src/domains/instruments/source-authority";

const oldRecognition = {
  id:
    "recognition-old",

  outcome:
    "RECOGNIZED_WITH_LIMITATION" as const,

  limitation:
    "Earlier documentary limitation.",

  reason:
    null,

  actorUserId:
    "operator-1",

  supersedesRecognitionId:
    null,

  currentSlot:
    null,

  occurredAt:
    new Date(
      "2026-10-03T12:00:00.000Z",
    ),

  evidenceLinks: [
    {
      evidenceId:
        "evidence-old",
    },
  ],

  supersededBy: {
    id:
      "recognition-current",
  },
};

const currentRecognition = {
  id:
    "recognition-current",

  outcome:
    "RECOGNIZED_WITH_LIMITATION" as const,

  limitation:
    "Registration documentation remains subject to documentary completion.",

  reason:
    null,

  actorUserId:
    "operator-2",

  supersedesRecognitionId:
    "recognition-old",

  currentSlot:
    "CURRENT" as const,

  occurredAt:
    new Date(
      "2026-10-03T13:00:00.000Z",
    ),

  evidenceLinks: [
    {
      evidenceId:
        "evidence-profile",
    },
  ],

  supersededBy:
    null,
};

const client = {
  institutionalInstrument: {
    findUnique:
      async () => ({
        id:
          "instrument-1",

        reference:
          "BAF-SAI-2026-001",

        kind:
          "SOURCE_AUTHORITY",

        title:
          "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",

        currentVersion:
          1,
      }),
  },

  instrumentVersion: {
    findUnique:
      async () => ({
        id:
          "version-1",

        number:
          1,
      }),
  },

  sourceAuthorityRecord: {
    findUnique:
      async () => ({
        id:
          "source-authority-1",

        instrumentId:
          "instrument-1",

        subjectDisplayName:
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

        assertions: [
          {
            id:
              "assertion-a001",

            versionId:
              "version-1",

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

            ordinal:
              1,

            capabilities:
              [],

            recognitions: [
              oldRecognition,
              currentRecognition,
            ],
          },

          {
            id:
              "assertion-a003",

            versionId:
              "version-1",

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

            ordinal:
              3,

            capabilities: [
              {
                capabilityKey:
                  "MINERAL_PRODUCTION_AGGREGATION",

                title:
                  "Mineral production aggregation",

                description:
                  "Source-side mineral production aggregation.",
              },
            ],

            recognitions:
              [],
          },

          {
            id:
              "assertion-a006",

            versionId:
              "version-1",

            reference:
              "BAF-SAI-2026-001:A006",

            assertionClass:
              "INSTRUMENT_BOUNDARY",

            title:
              "Instrument boundary",

            statement:
              "Internal boundary assertion.",

            scope:
              null,

            ordinal:
              6,

            capabilities:
              [],

            recognitions:
              [],
          },
        ],

        evidenceAdmissions: [
          {
            evidenceRole:
              "BAFOULA_SOURCE_PROFILE",

            evidenceId:
              "evidence-profile",

            createdAt:
              new Date(
                "2026-10-03T11:59:00.000Z",
              ),

            evidence: {
              id:
                "evidence-profile",

              instrumentId:
                "instrument-1",

              title:
                "Bafoula Source Authority Profile",

              metadata: {
                documentReference:
                  "BAF-PROFILE-MALI-2026-002",

                documentVersion:
                  "v4 · 2026",
              },
            },
          },
        ],
      }),
  },
} as unknown as
  SourceAuthorityPresentationLoaderClient;

async function main() {
  const canonical =
    await loadSourceAuthorityCanonicalStateWithClient({
      client,

      instrumentReference:
        "BAF-SAI-2026-001",
    });

  assert.equal(
    canonical.identity.instrumentReference,
    "BAF-SAI-2026-001",
  );

  assert.equal(
    canonical.identity.versionNumber,
    1,
  );

  assert.equal(
    canonical.assertions.length,
    3,
  );

  assert.equal(
    canonical.evidence.length,
    1,
  );

  assert.equal(
    canonical.evidence[0].reference,
    "BAF-PROFILE-MALI-2026-002",
  );

  const a001 =
    canonical.assertions.find(
      (assertion) =>
        assertion.reference ===
        "BAF-SAI-2026-001:A001",
    );

  assert.ok(a001);

  assert.equal(
    a001.currentRecognition
      ?.recognitionId,
    "recognition-current",
  );

  assert.deepEqual(
    a001.evidenceIds,
    [
      "evidence-profile",
    ],
    "ASSERTION_CURRENT_EVIDENCE_ONLY",
  );

  assert.equal(
    a001.currentRecognition
      ?.actorDisplayName,
    null,
    "ACTOR_DISPLAY_NAME_MUST_NOT_BE_INFERRED",
  );

  assert.equal(
    canonical.recognitionHistory.length,
    2,
  );

  assert.equal(
    canonical.recognitionHistory[0]
      .evidenceIds[0],
    "evidence-old",
  );

  assert.equal(
    canonical.recognitionHistory[1]
      .evidenceIds[0],
    "evidence-profile",
  );

  const operator =
    deriveSourceAuthorityPresentation({
      audience:
        "OPERATOR",

      canonical,
    });

  const representative =
    deriveSourceAuthorityPresentation({
      audience:
        "REPRESENTATIVE",

      canonical,
    });

  assert.equal(
    operator.assertions.length,
    3,
  );

  assert.equal(
    operator.operatorRecord.length,
    2,
  );

  assert.equal(
    representative.assertions.length,
    2,
  );

  assert.equal(
    representative.operatorRecord.length,
    0,
  );

  assert.equal(
    representative.assertions.some(
      (assertion) =>
        assertion.reference ===
        "BAF-SAI-2026-001:A006",
    ),
    false,
  );

  assert.equal(
    representative.boundary
      .transactionAuthorityConferred,
    false,
  );

  assert.equal(
    representative.boundary
      .sovereignAuthorityEstablished,
    false,
  );

  console.log(
    "SOURCE_AUTHORITY_PRESENTATION_LOADER_OK",
  );

  console.log({
    instrumentReference:
      canonical.identity.instrumentReference,

    versionNumber:
      canonical.identity.versionNumber,

    canonicalAssertions:
      canonical.assertions.length,

    admittedEvidence:
      canonical.evidence.length,

    recognitionHistory:
      canonical.recognitionHistory.length,

    currentEvidence:
      a001.evidenceIds,

    historicalEvidence:
      canonical.recognitionHistory
        .flatMap(
          (recognition) =>
            recognition.evidenceIds,
        ),

    actorDisplayNameInferred:
      false,

    representativeAssertions:
      representative.assertions.length,

    representativeOperatorHistory:
      representative.operatorRecord.length,

    transactionAuthorityConferred:
      false,

    sovereignAuthorityEstablished:
      false,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
