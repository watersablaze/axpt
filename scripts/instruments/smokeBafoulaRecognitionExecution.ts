import assert from "node:assert/strict";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import {
  seedBafoulaSourceAuthorityWithClient,
} from "../../src/domains/instruments/source-authority/seeds/seedBafoulaSourceAuthorityWithClient";

import {
  admitBafoulaSourceProfileEvidenceWithClient,
} from "../../src/domains/instruments/source-authority/evidence/admitBafoulaSourceProfileEvidenceWithClient";

import {
  recordInstrumentEvidenceWithClient,
} from "../../src/domains/instruments/commands/recordInstrumentEvidenceWithClient";

import {
  executeBafoulaProfileRecognitionWithClient,
} from "../../src/domains/instruments/source-authority/recognition/executeBafoulaProfileRecognitionWithClient";

type TransactionClient =
  Pick<
    PrismaClientType,
    | "user"
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "sourceAuthorityEvidenceAdmission"
    | "instrumentEvidence"
    | "domainEvent"
  >;

type RecognitionExecutionResult =
  Readonly<{
    created: boolean;
  }>;

type RecognitionEvidenceLinkSnapshot =
  Readonly<{
    evidenceId: string;
  }>;

type RecognitionSnapshot =
  Readonly<{
    id: string;
    assertionId: string;
    outcome: string;
    limitation: string | null;
    reason: string | null;
    currentSlot: "CURRENT" | null;
  }>;

type AssertionSnapshot =
  Readonly<{
    id: string;
    reference: string;
  }>;

async function main() {
  const prisma =
    new PrismaClient();

  try {
    console.log(
      "── CREATE DISPOSABLE OPERATOR ──",
    );

    const actor =
      await prisma.user.create({
        data: {
          username:
            "bafoula-recognition-operator",

          passwordHash:
            "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

          email:
            "bafoula-recognition@example.invalid",

          isAdmin:
            true,

          viewedDocs:
            [],
        },
      });

    console.log(
      "✓ disposable operator created",
    );

    console.log("");
    console.log(
      "── SEED CANONICAL BAFOULA SAI ──",
    );

    await prisma.$transaction(
      async (
        tx: TransactionClient,
      ) =>
        seedBafoulaSourceAuthorityWithClient({
          client:
            tx,

          actorUserId:
            actor.id,
        }),
    );

    console.log(
      "✓ canonical Bafoula SAI seeded",
    );

    console.log("");
    console.log(
      "── ADMIT CANONICAL BAFOULA PROFILE EVIDENCE ──",
    );

    const admitted =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) =>
          admitBafoulaSourceProfileEvidenceWithClient({
            client:
              tx,

            actorUserId:
              actor.id,

            uri:
              "axpt://evidence/bafoula/BAF-PROFILE-MALI-2026-002/v4/recognition-proof",

            contentHash:
              "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",

            recordedAt:
              new Date(
                "2026-10-03T13:00:00.000Z",
              ),
          }),
      );

    assert.equal(
      admitted.created,
      true,
    );

    console.log(
      "✓ canonical profile evidence admitted",
    );

    console.log("");
    console.log(
      "── ADD UNRELATED EVIDENCE ROLE ──",
    );

    const instrumentForUnrelatedEvidence =
      await prisma
        .institutionalInstrument
        .findUniqueOrThrow({
          where: {
            reference:
              "BAF-SAI-2026-001",
          },

          select: {
            id:
              true,

            sourceAuthorityRecord: {
              select: {
                id:
                  true,
              },
            },
          },
        });

    assert.ok(
      instrumentForUnrelatedEvidence
        .sourceAuthorityRecord,
      "SOURCE_AUTHORITY_ROOT_REQUIRED_FOR_UNRELATED_EVIDENCE",
    );

    const unrelatedEvidence =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          const recorded =
            await recordInstrumentEvidenceWithClient({
              client:
                tx,

              instrumentReference:
                "BAF-SAI-2026-001",

              evidenceType:
                "DOCUMENT",

              subjectType:
                "INSTRUMENT",

              subjectId:
                instrumentForUnrelatedEvidence.id,

              title:
                "Unrelated Source Authority Regression Evidence",

              uri:
                "axpt://evidence/bafoula/test-unrelated-evidence",

              contentHash:
                "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",

              metadata: {
                smokeOnly:
                  true,

                recognitionImplied:
                  false,
              },

              recordedByUserId:
                actor.id,

              recordedAt:
                new Date(
                  "2026-10-03T13:02:00.000Z",
                ),
            });

          await tx
            .sourceAuthorityEvidenceAdmission
            .create({
              data: {
                sourceAuthorityId:
                  instrumentForUnrelatedEvidence
                    .sourceAuthorityRecord.id,

                evidenceRole:
                  "TEST_UNRELATED_EVIDENCE",

                admissionKey:
                  "smoke:test-unrelated-evidence",

                evidenceId:
                  recorded.evidence.id,
              },
            });

          return recorded.evidence;
        },
      );

    const admissionCount =
      await prisma
        .sourceAuthorityEvidenceAdmission
        .count({
          where: {
            sourceAuthorityId:
              instrumentForUnrelatedEvidence
                .sourceAuthorityRecord.id,
          },
        });

    assert.equal(
      admissionCount,
      2,
      "EXACTLY_TWO_EVIDENCE_ROLES_MUST_COEXIST",
    );

    console.log(
      "✓ canonical and unrelated evidence roles coexist",
    );

    console.log("");
    console.log(
      "── FIRST AUTHORIZED RECOGNITION EXECUTION ──",
    );

    const first =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) =>
          executeBafoulaProfileRecognitionWithClient({
            client:
              tx,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T13:05:00.000Z",
              ),
          }),
      );

    assert.deepEqual(
      [
        ...first.recognizedAssertionReferences,
      ],
      [
        "A001",
        "A003",
        "A005",
      ],
    );

    assert.equal(
      first.results.length,
      3,
    );

    assert.equal(
      (
        first.results as
          readonly RecognitionExecutionResult[]
      ).filter(
        (result) =>
          result.created,
      ).length,
      3,
      "FIRST_EXECUTION_MUST_CREATE_THREE_RECOGNITIONS",
    );

    console.log(
      "✓ A001 / A003 / A005 recognized with limitation",
    );

    console.log("");
    console.log(
      "── SECOND IDENTICAL EXECUTION / IDEMPOTENT REPLAY ──",
    );

    const second =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) =>
          executeBafoulaProfileRecognitionWithClient({
            client:
              tx,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T13:10:00.000Z",
              ),
          }),
      );

    assert.equal(
      second.results.length,
      3,
    );

    assert.equal(
      (
        second.results as
          readonly RecognitionExecutionResult[]
      ).filter(
        (result) =>
          result.created,
      ).length,
      0,
      "SECOND_EXECUTION_MUST_BE_IDEMPOTENT",
    );

    console.log(
      "✓ second execution replayed existing recognitions",
    );

    console.log("");
    console.log(
      "── VERIFY ASSERTION-SCOPED RECOGNITION STATE ──",
    );

    const instrument =
      await prisma
        .institutionalInstrument
        .findUniqueOrThrow({
          where: {
            reference:
              "BAF-SAI-2026-001",
          },

          select: {
            id:
              true,

            sourceAuthorityRecord: {
              select: {
                id:
                  true,
              },
            },
          },
        });

    assert.ok(
      instrument.sourceAuthorityRecord,
      "SOURCE_AUTHORITY_ROOT_REQUIRED",
    );

    const assertions =
      (
        await prisma
          .sourceAuthorityAssertion
          .findMany({
            where: {
              sourceAuthorityId:
                instrument
                  .sourceAuthorityRecord
                  .id,
            },

            select: {
              id:
                true,

              reference:
                true,
            },

            orderBy: {
              ordinal:
                "asc",
            },
          })
      ) as readonly AssertionSnapshot[];

    const referenceByAssertionId =
      new Map(
        assertions.map(
          (assertion) => [
            assertion.id,
            assertion.reference,
          ] as const,
        ),
      );

    const recognitions =
      (
        await prisma
          .sourceAuthorityRecognition
          .findMany({
            where: {
              assertionId: {
                in:
                  assertions.map(
                    (assertion) =>
                      assertion.id,
                  ),
              },
            },

            orderBy: {
              occurredAt:
                "asc",
            },
          })
      ) as readonly RecognitionSnapshot[];

    assert.equal(
      recognitions.length,
      3,
      "EXACTLY_THREE_RECOGNITIONS_REQUIRED",
    );

    const recognitionReferences =
      recognitions.map(
        (recognition) =>
          referenceByAssertionId.get(
            recognition.assertionId,
          ),
      );

    assert.deepEqual(
      [...recognitionReferences].sort(),
      [
        "A001",
        "A003",
        "A005",
      ],
    );

    for (
      const recognition
      of recognitions
    ) {
      assert.equal(
        recognition.outcome,
        "RECOGNIZED_WITH_LIMITATION",
      );

      assert.ok(
        recognition.limitation,
        "LIMITATION_REQUIRED",
      );

      assert.equal(
        recognition.reason,
        null,
      );

      assert.equal(
        recognition.currentSlot,
        "CURRENT",
      );
    }

    console.log(
      "✓ exactly three current limited recognitions persisted",
    );

    console.log("");
    console.log(
      "── VERIFY HELD / INTERNAL ASSERTIONS REMAIN UNRECOGNIZED ──",
    );

    for (
      const reference
      of [
        "A002",
        "A004",
        "A006",
      ]
    ) {
      const assertion =
        assertions.find(
          (candidate) =>
            candidate.reference ===
            reference,
        );

      assert.ok(
        assertion,
        `ASSERTION_NOT_FOUND:${reference}`,
      );

      const count =
        recognitions.filter(
          (recognition) =>
            recognition.assertionId ===
            assertion.id,
        ).length;

      assert.equal(
        count,
        0,
        `${reference}_MUST_REMAIN_UNRECOGNIZED`,
      );
    }

    console.log(
      "✓ A002 / A004 / A006 remain unrecognized",
    );

    console.log("");
    console.log(
      "── VERIFY RECOGNITION-EVIDENCE LINKS ──",
    );

    const links =
      await prisma
        .sourceAuthorityRecognitionEvidence
        .findMany({
          where: {
            recognitionId: {
              in:
                recognitions.map(
                  (recognition) =>
                    recognition.id,
                ),
            },
          },
        });

    assert.equal(
      links.length,
      3,
      "EXACTLY_THREE_RECOGNITION_EVIDENCE_LINKS_REQUIRED",
    );

    assert.ok(
      (
        links as
          readonly RecognitionEvidenceLinkSnapshot[]
      ).every(
        (link) =>
          link.evidenceId ===
          admitted.evidence.id,
      ),
      "ALL_RECOGNITIONS_MUST_USE_CANONICAL_PROFILE_EVIDENCE",
    );

    console.log(
      "✓ all three recognitions bound to canonical profile evidence",
    );

    const unrelatedRecognitionLinks =
      await prisma
        .sourceAuthorityRecognitionEvidence
        .count({
          where: {
            evidenceId:
              unrelatedEvidence.id,
          },
        });

    assert.equal(
      unrelatedRecognitionLinks,
      0,
      "UNRELATED_EVIDENCE_MUST_NOT_SUPPORT_PROFILE_RECOGNITION",
    );

    console.log(
      "✓ unrelated evidence has zero recognition links",
    );

    console.log("");
    console.log(
      "── VERIFY RECOGNITION EVENTS ──",
    );

    const recordedEvents =
      await prisma
        .domainEvent
        .count({
          where: {
            streamId:
              instrument.id,

            eventType:
              "SOURCE_AUTHORITY_RECOGNITION_RECORDED",
          },
        });

    const supersededEvents =
      await prisma
        .domainEvent
        .count({
          where: {
            streamId:
              instrument.id,

            eventType:
              "SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED",
          },
        });

    assert.equal(
      recordedEvents,
      3,
      "EXACTLY_THREE_RECOGNITION_RECORDED_EVENTS_REQUIRED",
    );

    assert.equal(
      supersededEvents,
      0,
      "NO_SUPERSESSION_EVENTS_EXPECTED",
    );

    console.log(
      "✓ exactly three recognition-recorded events",
    );

    console.log(
      "✓ zero supersession events",
    );

    console.log("");
    console.log(
      "✓ Bafoula recognition execution smoke passed",
    );

    console.log({
      recognized:
        [
          "A001",
          "A003",
          "A005",
        ],

      held:
        [
          "A002",
          "A004",
        ],

      internalOnly:
        [
          "A006",
        ],

      recognitions:
        recognitions.length,

      recognitionEvidenceLinks:
        links.length,

      recognitionRecordedEvents:
        recordedEvents,

      supersessionEvents:
        supersededEvents,

      secondExecutionIdempotent:
        true,

      evidenceRolesCoexisting:
        2,

      unrelatedRecognitionLinks:
        0,

      transactionAuthorityConferred:
        false,

      sovereignAuthorityConferred:
        false,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
