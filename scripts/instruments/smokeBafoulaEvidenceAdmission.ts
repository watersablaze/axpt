import assert from "node:assert/strict";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import {
  seedBafoulaSourceAuthorityWithClient,
  type BafoulaSourceAuthoritySeedClient,
} from "../../src/domains/instruments/source-authority/seeds/seedBafoulaSourceAuthorityWithClient";

import {
  admitBafoulaSourceProfileEvidenceWithClient,
  type BafoulaProfileEvidenceAdmissionClient,
} from "../../src/domains/instruments/source-authority/evidence/admitBafoulaSourceProfileEvidenceWithClient";

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


type AssertionIdentity =
  Readonly<{
    id: string;
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
            "bafoula-evidence-operator",

          passwordHash:
            "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

          email:
            "bafoula-evidence@example.invalid",

          isAdmin:
            true,

          viewedDocs:
            [],
        },
      });

    console.log(
      "✓ disposable evidence operator created",
    );

    console.log("");
    console.log(
      "── SEED CANONICAL BAFOULA SAI ──",
    );

    const seeded =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          return seedBafoulaSourceAuthorityWithClient({
            client:
              tx as BafoulaSourceAuthoritySeedClient,

            actorUserId:
              actor.id,
          });
        },
      );

    assert.equal(
      seeded.instrument.reference,
      "BAF-SAI-2026-001",
    );

    console.log(
      "✓ canonical Bafoula SAI seeded",
    );

    const profileUri =
      "axpt://evidence/bafoula/BAF-PROFILE-MALI-2026-002/v4";

    const profileHash =
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    console.log("");
    console.log(
      "── FIRST PROFILE EVIDENCE ADMISSION ──",
    );

    const first =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          return admitBafoulaSourceProfileEvidenceWithClient({
            client:
              tx as BafoulaProfileEvidenceAdmissionClient,

            actorUserId:
              actor.id,

            uri:
              profileUri,

            contentHash:
              profileHash,

            recordedAt:
              new Date(
                "2026-10-03T11:00:00.000Z",
              ),
          });
        },
      );

    assert.equal(
      first.created,
      true,
      "FIRST_EVIDENCE_ADMISSION_MUST_CREATE",
    );

    console.log(
      "✓ first profile evidence admitted",
    );

    console.log("");
    console.log(
      "── SECOND IDENTICAL PROFILE EVIDENCE ADMISSION ──",
    );

    const second =
      await prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          return admitBafoulaSourceProfileEvidenceWithClient({
            client:
              tx as BafoulaProfileEvidenceAdmissionClient,

            actorUserId:
              actor.id,

            uri:
              profileUri,

            contentHash:
              profileHash,

            recordedAt:
              new Date(
                "2026-10-03T11:01:00.000Z",
              ),
          });
        },
      );

    assert.equal(
      second.created,
      false,
      "SECOND_IDENTICAL_EVIDENCE_ADMISSION_MUST_REPLAY",
    );

    assert.equal(
      second.evidence.id,
      first.evidence.id,
      "SECOND_IDENTICAL_ADMISSION_MUST_RETURN_SAME_EVIDENCE",
    );

    console.log(
      "✓ second admission resolved to same evidence object",
    );

    console.log("");
    console.log(
      "── VERIFY EXACT EVIDENCE CARDINALITY ──",
    );

    const evidence =
      await prisma.instrumentEvidence.findMany({
        where: {
          instrumentId:
            seeded.instrument.id,
        },

        orderBy: {
          recordedAt:
            "asc",
        },
      });

    assert.equal(
      evidence.length,
      1,
      "BAFOULA_PROFILE_EVIDENCE_CARDINALITY_MUST_BE_ONE",
    );

    const canonical =
      evidence[0];

    assert.equal(
      canonical.evidenceType,
      "DOCUMENT",
    );

    assert.equal(
      canonical.subjectType,
      "INSTRUMENT",
    );

    assert.equal(
      canonical.subjectId,
      seeded.instrument.id,
    );

    assert.equal(
      canonical.uri,
      profileUri,
    );

    assert.equal(
      canonical.contentHash,
      profileHash,
    );

    assert.equal(
      canonical.title,
      "Coopérative de Bafoula Source Authority Profile",
    );

    assert.ok(
      canonical.metadata &&
      typeof canonical.metadata ===
        "object",
      "BAFOULA_PROFILE_METADATA_REQUIRED",
    );

    const metadata =
      canonical.metadata as
        Record<string, unknown>;

    assert.equal(
      metadata.documentReference,
      "BAF-PROFILE-MALI-2026-002",
    );

    assert.equal(
      metadata.documentVersion,
      "v4 · 2026",
    );

    assert.equal(
      metadata.documentStatus,
      "External Reference",
    );

    assert.equal(
      metadata.recognitionImplied,
      false,
    );

    assert.equal(
      metadata.transactionAuthorityConferred,
      false,
    );

    assert.equal(
      metadata.sovereignAuthorityConferred,
      false,
    );

    assert.deepEqual(
      metadata.candidateAssertionReferences,
      [
        "A001",
        "A002",
        "A003",
        "A004",
        "A005",
      ],
    );

    console.log(
      "✓ exactly one canonical profile evidence object persisted",
    );

    console.log("");
    console.log(
      "── VERIFY EVIDENCE EVENT IDEMPOTENCY ──",
    );

    const evidenceEvents =
      await prisma.domainEvent.findMany({
        where: {
          streamId:
            seeded.instrument.id,

          eventType:
            "INSTRUMENT_EVIDENCE_RECORDED",
        },
      });

    assert.equal(
      evidenceEvents.length,
      1,
      "PROFILE_EVIDENCE_EVENT_CARDINALITY_MUST_BE_ONE",
    );

    console.log(
      "✓ exactly one evidence-recorded event persisted",
    );

    console.log("");
    console.log(
      "── VERIFY ZERO SOURCE AUTHORITY RECOGNITION ──",
    );

    const assertions =
      await prisma
        .sourceAuthorityAssertion
        .findMany({
          where: {
            sourceAuthorityId:
              seeded.sourceAuthority.id,
          },

          select: {
            id: true,
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

    const recognitionCount =
      await prisma
        .sourceAuthorityRecognition
        .count({
          where: {
            assertionId: {
              in:
                assertionIds,
            },
          },
        });

    assert.equal(
      recognitionCount,
      0,
      "EVIDENCE_ADMISSION_MUST_NOT_CREATE_RECOGNITION",
    );

    const recognitionEvidenceCount =
      await prisma
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
      recognitionEvidenceCount,
      0,
      "EVIDENCE_ADMISSION_MUST_NOT_CREATE_RECOGNITION_LINKS",
    );

    console.log(
      "✓ recognition count = 0",
    );

    console.log(
      "✓ recognition-evidence links = 0",
    );

    console.log("");
    console.log(
      "✓ Bafoula evidence admission smoke passed",
    );

    console.log({
      instrumentReference:
        seeded.instrument.reference,

      profileEvidence:
        1,

      evidenceRecordedEvents:
        evidenceEvents.length,

      recognitions:
        recognitionCount,

      recognitionEvidenceLinks:
        recognitionEvidenceCount,

      secondAdmissionWasIdempotent:
        true,

      recognitionImplied:
        false,

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
