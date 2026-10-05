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

type TransactionClient =
  Pick<
    PrismaClientType,
    | "user"
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityProfileParticulars"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "sourceAuthorityEvidenceAdmission"
    | "instrumentEvidence"
    | "domainEvent"
  >;

type AssertionIdentity =
  Readonly<{
    id: string;
  }>;

function messageOf(
  value: unknown,
): string {
  if (value instanceof Error) {
    return value.message;
  }

  return String(value);
}

async function main() {
  const setup =
    new PrismaClient();

  const writerA =
    new PrismaClient();

  const writerB =
    new PrismaClient();

  try {
    console.log(
      "── CREATE DISPOSABLE OPERATOR ──",
    );

    const actor =
      await setup.user.create({
        data: {
          username:
            "bafoula-evidence-concurrency-operator",

          passwordHash:
            "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

          email:
            "bafoula-evidence-concurrency@example.invalid",

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
      "── SEED CANONICAL BAFOULA SOURCE AUTHORITY ──",
    );

    const seeded =
      await setup.$transaction(
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

    assert.equal(
      seeded.instrument.reference,
      "BAF-SAI-2026-001",
    );

    console.log(
      "✓ canonical Bafoula Source Authority seeded",
    );

    const uri =
      "axpt://evidence/bafoula/BAF-PROFILE-MALI-2026-002/v4/concurrency-proof";

    const contentHash =
      "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const recordedAt =
      new Date(
        "2026-10-03T12:30:00.000Z",
      );

    console.log("");
    console.log(
      "── LAUNCH TWO INDEPENDENT FIRST-ADMISSION WRITERS ──",
    );

    const race =
      await Promise.allSettled([
        writerA.$transaction(
          async (
            tx: TransactionClient,
          ) =>
            admitBafoulaSourceProfileEvidenceWithClient({
              client:
                tx,

              actorUserId:
                actor.id,

              uri,

              contentHash,

              recordedAt,
            }),
          {
            timeout:
              15_000,
          },
        ),

        writerB.$transaction(
          async (
            tx: TransactionClient,
          ) =>
            admitBafoulaSourceProfileEvidenceWithClient({
              client:
                tx,

              actorUserId:
                actor.id,

              uri,

              contentHash,

              recordedAt,
            }),
          {
            timeout:
              15_000,
          },
        ),
      ]);

    const failures =
      race.filter(
        (
          result,
        ): result is PromiseRejectedResult =>
          result.status ===
          "rejected",
      );

    if (failures.length > 0) {
      console.error(
        "Concurrent admission failure(s):",
      );

      for (
        const failure
        of failures
      ) {
        console.error(
          messageOf(
            failure.reason,
          ),
        );
      }
    }

    assert.equal(
      failures.length,
      0,
      "BOTH_CONCURRENT_ADMISSIONS_MUST_RESOLVE",
    );

    const successes =
      race
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<
            Awaited<
              ReturnType<
                typeof admitBafoulaSourceProfileEvidenceWithClient
              >
            >
          > =>
            result.status ===
            "fulfilled",
        )
        .map(
          (result) =>
            result.value,
        );

    assert.equal(
      successes.length,
      2,
      "CONCURRENT_ADMISSION_MUST_HAVE_TWO_SUCCESSFUL_CALLERS",
    );

    const created =
      successes.filter(
        (result) =>
          result.created,
      );

    const replayed =
      successes.filter(
        (result) =>
          !result.created,
      );

    assert.equal(
      created.length,
      1,
      "CONCURRENT_FIRST_ADMISSION_MUST_HAVE_EXACTLY_ONE_CREATOR",
    );

    assert.equal(
      replayed.length,
      1,
      "CONCURRENT_FIRST_ADMISSION_MUST_HAVE_EXACTLY_ONE_REPLAY",
    );

    assert.equal(
      successes[0].evidence.id,
      successes[1].evidence.id,
      "CONCURRENT_WRITERS_MUST_RESOLVE_SAME_EVIDENCE",
    );

    console.log(
      "✓ exactly one concurrent writer created evidence",
    );

    console.log(
      "✓ exactly one concurrent writer replayed winner",
    );

    console.log(
      "✓ both writers resolved same evidence object",
    );

    console.log("");
    console.log(
      "── VERIFY DURABLE CLAIM CARDINALITY ──",
    );

    const instrument =
      await setup
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

    const claims =
      await setup
        .sourceAuthorityEvidenceAdmission
        .findMany({
          where: {
            sourceAuthorityId:
              instrument
                .sourceAuthorityRecord
                .id,
          },

          orderBy: {
            createdAt:
              "asc",
          },
        });

    assert.equal(
      claims.length,
      1,
      "CONCURRENT_ADMISSION_MUST_PERSIST_ONE_CLAIM",
    );

    assert.ok(
      claims[0].evidenceId,
      "ADMISSION_CLAIM_MUST_BE_BOUND_TO_EVIDENCE",
    );

    assert.equal(
      claims[0].evidenceId,
      successes[0].evidence.id,
      "CLAIM_MUST_REFERENCE_CANONICAL_EVIDENCE",
    );

    console.log(
      "✓ exactly one admission claim persisted",
    );

    console.log(
      "✓ claim bound to canonical evidence",
    );

    console.log("");
    console.log(
      "── VERIFY DURABLE EVIDENCE CARDINALITY ──",
    );

    const evidence =
      await setup
        .instrumentEvidence
        .findMany({
          where: {
            instrumentId:
              instrument.id,

            evidenceType:
              "DOCUMENT",

            subjectType:
              "INSTRUMENT",

            subjectId:
              instrument.id,

            uri,

            contentHash,
          },
        });

    assert.equal(
      evidence.length,
      1,
      "CONCURRENT_ADMISSION_MUST_PERSIST_ONE_EVIDENCE_ROW",
    );

    assert.equal(
      evidence[0].id,
      claims[0].evidenceId,
    );

    console.log(
      "✓ exactly one canonical evidence row persisted",
    );

    console.log("");
    console.log(
      "── VERIFY EXACT EVENT CARDINALITY ──",
    );

    const events =
      await setup
        .domainEvent
        .findMany({
          where: {
            streamId:
              instrument.id,

            eventType:
              "INSTRUMENT_EVIDENCE_RECORDED",
          },
        });

    assert.equal(
      events.length,
      1,
      "CONCURRENT_ADMISSION_MUST_PERSIST_ONE_EVIDENCE_EVENT",
    );

    console.log(
      "✓ exactly one evidence-recorded event persisted",
    );

    console.log("");
    console.log(
      "── VERIFY ZERO RECOGNITION SIDE EFFECTS ──",
    );

    const assertions =
      await setup
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
          },
        });

    const assertionIds =
      (
        assertions as
          readonly AssertionIdentity[]
      ).map(
        (assertion) =>
          assertion.id,
      );

    const recognitions =
      await setup
        .sourceAuthorityRecognition
        .count({
          where: {
            assertionId: {
              in:
                assertionIds,
            },
          },
        });

    const recognitionLinks =
      await setup
        .sourceAuthorityRecognitionEvidence
        .count({
          where: {
            recognition: {
              assertionId: {
                in:
                  assertionIds,
              },
            },
          },
        });

    assert.equal(
      recognitions,
      0,
      "EVIDENCE_ADMISSION_RACE_MUST_NOT_CREATE_RECOGNITION",
    );

    assert.equal(
      recognitionLinks,
      0,
      "EVIDENCE_ADMISSION_RACE_MUST_NOT_CREATE_RECOGNITION_LINKS",
    );

    console.log(
      "✓ recognition count = 0",
    );

    console.log(
      "✓ recognition-evidence links = 0",
    );

    console.log("");
    console.log(
      "✓ Bafoula evidence admission concurrency smoke passed",
    );

    console.log({
      concurrentWriters:
        2,

      creators:
        created.length,

      replays:
        replayed.length,

      admissionClaims:
        claims.length,

      evidenceRows:
        evidence.length,

      evidenceEvents:
        events.length,

      recognitions,

      recognitionEvidenceLinks:
        recognitionLinks,

      sameEvidenceResolved:
        successes[0].evidence.id ===
        successes[1].evidence.id,

      evidenceImpliesRecognition:
        false,
    });
  } finally {
    await Promise.allSettled([
      setup.$disconnect(),
      writerA.$disconnect(),
      writerB.$disconnect(),
    ]);
  }
}

main();
