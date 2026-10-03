import assert from "node:assert/strict";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import {
  SOURCE_AUTHORITY_ASSERTION_CLASS,
  SOURCE_AUTHORITY_CAPABILITY,
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
} from "../../src/domains/instruments/source-authority/contracts";

import {
  establishSourceAuthorityWithClient,
} from "../../src/domains/instruments/source-authority/commands/establishSourceAuthorityWithClient";

import {
  recordSourceAuthorityAssertionWithClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityAssertionWithClient";

import {
  recordSourceAuthorityCapabilityWithClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityCapabilityWithClient";

import {
  recordSourceAuthorityRecognitionWithClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityRecognitionWithClient";

type SmokeClient = Pick<
  PrismaClientType,
  | "user"
  | "institutionalInstrument"
  | "instrumentVersion"
  | "sourceAuthorityRecord"
  | "sourceAuthorityAssertion"
  | "sourceAuthorityCapability"
  | "sourceAuthorityRecognition"
  | "sourceAuthorityRecognitionEvidence"
  | "instrumentEvidence"
  | "domainEvent"
>;

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10_000,
    timeout: 60_000,
  },
});

const ROLLBACK =
  "SAI_1G_SOURCE_AUTHORITY_INTEGRITY_SMOKE_ROLLBACK";

type RecognitionEvidenceLinkSnapshot =
  Readonly<{
    evidenceId: string;
  }>;

type DomainEventTypeSnapshot =
  Readonly<{
    eventType: string;
  }>;

async function counts() {
  return {
    users:
      await prisma.user.count(),

    instruments:
      await prisma.institutionalInstrument.count(),

    versions:
      await prisma.instrumentVersion.count(),

    sourceAuthorityRecords:
      await prisma.sourceAuthorityRecord.count(),

    assertions:
      await prisma.sourceAuthorityAssertion.count(),

    capabilities:
      await prisma.sourceAuthorityCapability.count(),

    recognitions:
      await prisma.sourceAuthorityRecognition.count(),

    recognitionEvidence:
      await prisma.sourceAuthorityRecognitionEvidence.count(),

    evidence:
      await prisma.instrumentEvidence.count(),

    events:
      await prisma.domainEvent.count(),
  };
}

async function main() {
  const baseline = await counts();

  console.log(
    "✓ durable baseline captured",
    baseline,
  );

  try {
    await prisma.$transaction(
      async (tx: SmokeClient) => {
        const actor =
          await tx.user.create({
            data: {
              username:
                "sai-1g-smoke-operator",

              passwordHash:
                "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

              email:
                "sai-1g-smoke@example.invalid",

              isAdmin: true,

              viewedDocs: [],
            },
          });

        console.log(
          "✓ temporary operator created inside rollback boundary",
        );

        const subject = {
          displayName:
            "Coopérative de Bafoula",

          jurisdiction:
            "République du Mali",

          institutionalCapacity:
            "Malian Cooperative · Source Authority",

          operatingBase:
            "Bamako, Mali",

          sector:
            "Minerals and Natural Resources",

          principalCommodityActivity: [
            "Gold Doré",
          ],
        } as const;

        const established =
          await establishSourceAuthorityWithClient({
            client: tx,
            reference:
              "SMOKE-BAF-SAI-2026-001",

            title:
              "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",

            subject,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:00:00.000Z",
              ),
          });

        assert.equal(
          established.created,
          true,
        );

        console.log(
          "✓ canonical Source Authority root established",
        );

        const repeatedEstablishment =
          await establishSourceAuthorityWithClient({
            client: tx,
            reference:
              "SMOKE-BAF-SAI-2026-001",

            title:
              "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",

            subject,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:00:01.000Z",
              ),
          });

        assert.equal(
          repeatedEstablishment.created,
          false,
        );

        assert.equal(
          repeatedEstablishment.instrument.id,
          established.instrument.id,
        );

        console.log(
          "✓ exact Source Authority establishment is idempotent",
        );

        await assert.rejects(
          () =>
            establishSourceAuthorityWithClient({
              client: tx,

              reference:
                "SMOKE-BAF-SAI-2026-001",

              title:
                "CONFLICTING SOURCE AUTHORITY TITLE",

              subject,

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_EXISTING_ROOT_CONFLICT/,
        );

        console.log(
          "✓ conflicting root convergence rejected",
        );

        const assertionResult =
          await recordSourceAuthorityAssertionWithClient({
            client: tx,

            instrumentReference:
              established.instrument.reference,

            versionNumber: 1,

            reference:
              "A001",

            assertionClass:
              SOURCE_AUTHORITY_ASSERTION_CLASS
                .INSTITUTIONAL_IDENTITY,

            title:
              "Institutional Identity",

            statement:
              "Coopérative de Bafoula is recorded as the institutional subject of this Source Authority Instrument.",

            scope:
              "Institutional identity only.",

            ordinal: 1,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:01:00.000Z",
              ),
          });

        assert.equal(
          assertionResult.created,
          true,
        );

        const assertion =
          assertionResult.assertion;

        console.log(
          "✓ version-bound assertion recorded",
        );

        const repeatedAssertion =
          await recordSourceAuthorityAssertionWithClient({
            client: tx,

            instrumentReference:
              established.instrument.reference,

            versionNumber: 1,

            reference:
              "A001",

            assertionClass:
              SOURCE_AUTHORITY_ASSERTION_CLASS
                .INSTITUTIONAL_IDENTITY,

            title:
              "Institutional Identity",

            statement:
              "Coopérative de Bafoula is recorded as the institutional subject of this Source Authority Instrument.",

            scope:
              "Institutional identity only.",

            ordinal: 1,

            actorUserId:
              actor.id,
          });

        assert.equal(
          repeatedAssertion.created,
          false,
        );

        assert.equal(
          repeatedAssertion.assertion.id,
          assertion.id,
        );

        console.log(
          "✓ exact assertion recording is idempotent",
        );

        await assert.rejects(
          () =>
            recordSourceAuthorityAssertionWithClient({
              client: tx,

              instrumentReference:
                established.instrument.reference,

              versionNumber: 1,

              reference:
                "A001",

              assertionClass:
                SOURCE_AUTHORITY_ASSERTION_CLASS
                  .INSTITUTIONAL_IDENTITY,

              title:
                "Institutional Identity",

              statement:
                "Conflicting assertion meaning.",

              scope:
                "Institutional identity only.",

              ordinal: 1,

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_ASSERTION_SLOT_CONFLICT/,
        );

        console.log(
          "✓ contradictory assertion slot rejected",
        );

        const capabilityResult =
          await recordSourceAuthorityCapabilityWithClient({
            client: tx,

            assertionId:
              assertion.id,

            capabilityKey:
              SOURCE_AUTHORITY_CAPABILITY
                .MINERAL_PRODUCTION_AGGREGATION,

            title:
              "Mineral Production and Aggregation",

            description:
              "Records source-side production and aggregation capability without establishing current commodity availability.",

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:02:00.000Z",
              ),
          });

        assert.equal(
          capabilityResult.created,
          true,
        );

        const repeatedCapability =
          await recordSourceAuthorityCapabilityWithClient({
            client: tx,

            assertionId:
              assertion.id,

            capabilityKey:
              SOURCE_AUTHORITY_CAPABILITY
                .MINERAL_PRODUCTION_AGGREGATION,

            title:
              "Mineral Production and Aggregation",

            description:
              "Records source-side production and aggregation capability without establishing current commodity availability.",

            actorUserId:
              actor.id,
          });

        assert.equal(
          repeatedCapability.created,
          false,
        );

        console.log(
          "✓ capability slot is idempotent",
        );

        await assert.rejects(
          () =>
            recordSourceAuthorityCapabilityWithClient({
              client: tx,

              assertionId:
                assertion.id,

              capabilityKey:
                SOURCE_AUTHORITY_CAPABILITY
                  .MINERAL_PRODUCTION_AGGREGATION,

              title:
                "Mineral Production and Aggregation",

              description:
                "Conflicting capability meaning.",

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_CAPABILITY_SLOT_CONFLICT/,
        );

        console.log(
          "✓ contradictory capability slot rejected",
        );

        const evidence =
          await tx.instrumentEvidence.create({
            data: {
              instrumentId:
                established.instrument.id,

              evidenceType:
                "DOCUMENT",

              subjectType:
                "INSTRUMENT",

              subjectId:
                established.instrument.id,

              title:
                "SAI-1G canonical documentary evidence",

              recordedByUserId:
                actor.id,

              recordedAt:
                new Date(
                  "2026-10-03T08:03:00.000Z",
                ),
            },
          });

        console.log(
          "✓ canonical InstrumentEvidence fixture recorded",
        );

        const secondSource =
          await establishSourceAuthorityWithClient({
            client: tx,

            reference:
              "SMOKE-OTHER-SAI-2026-001",

            title:
              "OTHER SOURCE AUTHORITY SMOKE INSTRUMENT",

            subject: {
              displayName:
                "Other Source",

              jurisdiction:
                "Test Jurisdiction",

              institutionalCapacity:
                "Source Authority Test Fixture",

              operatingBase:
                null,

              sector:
                "Test",

              principalCommodityActivity: [
                "Test Commodity",
              ],
            },

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:03:30.000Z",
              ),
          });

        const foreignEvidence =
          await tx.instrumentEvidence.create({
            data: {
              instrumentId:
                secondSource.instrument.id,

              evidenceType:
                "DOCUMENT",

              subjectType:
                "INSTRUMENT",

              subjectId:
                secondSource.instrument.id,

              title:
                "Foreign SAI evidence fixture",

              recordedByUserId:
                actor.id,
            },
          });

        await assert.rejects(
          () =>
            recordSourceAuthorityRecognitionWithClient({
              client: tx,

              assertionId:
                assertion.id,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .RECOGNIZED,

              evidenceIds: [
                foreignEvidence.id,
              ],

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_INSTRUMENT_MISMATCH/,
        );

        console.log(
          "✓ foreign-instrument evidence rejected",
        );

        await assert.rejects(
          () =>
            recordSourceAuthorityRecognitionWithClient({
              client: tx,

              assertionId:
                assertion.id,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .RECOGNIZED,

              evidenceIds: [],

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_REQUIRED/,
        );

        console.log(
          "✓ affirmative recognition without evidence rejected",
        );

        const firstRecognition =
          await recordSourceAuthorityRecognitionWithClient({
            client: tx,

            assertionId:
              assertion.id,

            outcome:
              SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                .RECOGNIZED,

            evidenceIds: [
              evidence.id,
            ],

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:04:00.000Z",
              ),
          });

        assert.equal(
          firstRecognition.created,
          true,
        );

        console.log(
          "✓ evidence-backed assertion recognition recorded",
        );

        const repeatedRecognition =
          await recordSourceAuthorityRecognitionWithClient({
            client: tx,

            assertionId:
              assertion.id,

            outcome:
              SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                .RECOGNIZED,

            evidenceIds: [
              evidence.id,
            ],

            actorUserId:
              actor.id,
          });

        assert.equal(
          repeatedRecognition.created,
          false,
        );

        assert.equal(
          repeatedRecognition.recognition.id,
          firstRecognition.recognition.id,
        );

        console.log(
          "✓ exact recognition disposition is idempotent",
        );

        await assert.rejects(
          () =>
            recordSourceAuthorityRecognitionWithClient({
              client: tx,

              assertionId:
                assertion.id,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .NOT_RECOGNIZED,

              evidenceIds: [],

              reason:
                "Recognition withdrawn for smoke test.",

              actorUserId:
                actor.id,
            }),

          /SOURCE_AUTHORITY_RECOGNITION_ACTIVE_EXISTS_REQUIRES_SUPERSESSION/,
        );

        console.log(
          "✓ recognition cannot silently replace active recognition",
        );

        const replacement =
          await recordSourceAuthorityRecognitionWithClient({
            client: tx,

            assertionId:
              assertion.id,

            outcome:
              SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                .NOT_RECOGNIZED,

            evidenceIds: [],

            reason:
              "Recognition superseded for integrity smoke only.",

            supersedesRecognitionId:
              firstRecognition.recognition.id,

            actorUserId:
              actor.id,

            occurredAt:
              new Date(
                "2026-10-03T08:05:00.000Z",
              ),
          });

        assert.equal(
          replacement.created,
          true,
        );

        assert.equal(
          replacement.supersededRecognitionId,
          firstRecognition.recognition.id,
        );

        console.log(
          "✓ recognition supersession explicitly recorded",
        );

        await assert.rejects(
          () =>
            recordSourceAuthorityRecognitionWithClient({
              client: tx,

              assertionId:
                assertion.id,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .RECOGNIZED,

              evidenceIds: [
                evidence.id,
              ],

              supersedesRecognitionId:
                firstRecognition.recognition.id,

              actorUserId:
                actor.id,

              occurredAt:
                new Date(
                  "2026-10-03T08:06:00.000Z",
                ),
            }),

          /SOURCE_AUTHORITY_RECOGNITION_ALREADY_SUPERSEDED/,
        );

        console.log(
          "✓ already-superseded recognition cannot be superseded again",
        );

        const firstPersisted =
          await tx.sourceAuthorityRecognition.findUnique({
            where: {
              id:
                firstRecognition.recognition.id,
            },

            include: {
              supersededBy: true,
              evidenceLinks: true,
            },
          });

        assert.ok(firstPersisted);

        assert.equal(
          firstPersisted.supersededBy?.id,
          replacement.recognition.id,
        );

        assert.deepEqual(
          firstPersisted.evidenceLinks.map(
            (
              link:
                RecognitionEvidenceLinkSnapshot,
            ) => link.evidenceId,
          ),
          [evidence.id],
        );

        const replacementPersisted =
          await tx.sourceAuthorityRecognition.findUnique({
            where: {
              id:
                replacement.recognition.id,
            },
          });

        assert.ok(replacementPersisted);

        assert.equal(
          replacementPersisted.supersedesRecognitionId,
          firstRecognition.recognition.id,
        );

        console.log(
          "✓ supersession chain persisted bidirectionally",
        );

        const saiEvents =
          await tx.domainEvent.findMany({
            where: {
              streamId: {
                in: [
                  established.instrument.id,
                  secondSource.instrument.id,
                ],
              },
            },

            orderBy: {
              occurredAt: "asc",
            },
          });

        const eventTypes: string[] =
          saiEvents.map(
            (
              event:
                DomainEventTypeSnapshot,
            ) => event.eventType,
          );

        assert.equal(
          eventTypes.filter(
            (type) =>
              type ===
              "SOURCE_AUTHORITY_ESTABLISHED",
          ).length,
          2,
        );

        assert.equal(
          eventTypes.filter(
            (type) =>
              type ===
              "SOURCE_AUTHORITY_ASSERTION_RECORDED",
          ).length,
          1,
        );

        assert.equal(
          eventTypes.filter(
            (type) =>
              type ===
              "SOURCE_AUTHORITY_CAPABILITY_RECORDED",
          ).length,
          1,
        );

        assert.equal(
          eventTypes.filter(
            (type) =>
              type ===
              "SOURCE_AUTHORITY_RECOGNITION_RECORDED",
          ).length,
          2,
        );

        assert.equal(
          eventTypes.filter(
            (type) =>
              type ===
              "SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED",
          ).length,
          1,
        );

        console.log(
          "✓ Source Authority event history is coherent",
        );

        console.log(
          "✓ forcing transaction rollback",
        );

        throw new Error(ROLLBACK);
      },
      {
        timeout: 60_000,
      },
    );

    throw new Error(
      "[SAI_1G_EXPECTED_ROLLBACK_DID_NOT_OCCUR]",
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== ROLLBACK
    ) {
      throw error;
    }

    console.log(
      "✓ rollback sentinel received",
    );
  }

  const after = await counts();

  assert.deepEqual(
    after,
    baseline,
  );

  console.log(
    "✓ durable baseline restored exactly",
    after,
  );

  console.log("");
  console.log(
    "✓ Source Authority real transaction integrity smoke passed",
  );

  console.log({
    canonicalRoot:
      true,

    establishmentIdempotency:
      true,

    assertionSlotIntegrity:
      true,

    capabilitySlotIntegrity:
      true,

    evidenceInstrumentBoundary:
      true,

    recognitionRequiresEvidence:
      true,

    recognitionIdempotency:
      true,

    explicitRecognitionSupersession:
      true,

    supersessionSingleSuccessor:
      true,

    eventHistory:
      true,

    rollbackRestoresBaseline:
      true,
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
