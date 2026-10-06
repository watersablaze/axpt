import assert from "node:assert/strict";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@prisma/client";

import {
  SOURCE_AUTHORITY_ASSERTION_CLASS,
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
} from "../../src/domains/instruments/source-authority/contracts";

import {
  establishSourceAuthorityWithClient,
} from "../../src/domains/instruments/source-authority/commands/establishSourceAuthorityWithClient";

import {
  recordSourceAuthorityAssertionWithClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityAssertionWithClient";

import {
  recordSourceAuthorityRecognitionWithClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityRecognitionWithClient";

type ArchivalSetupClient =
  Pick<
    PrismaClientType,
    | "user"
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "instrumentEvidence"
    | "domainEvent"
  >;

function errorCode(
  value: unknown,
): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("code" in value)
  ) {
    return null;
  }

  const code =
    (value as {
      code?: unknown;
    }).code;

  return typeof code === "string"
    ? code
    : null;
}

async function expectForeignKeyRejection(
  label: string,
  operation: () => Promise<unknown>,
): Promise<void> {
  try {
    await operation();

    assert.fail(
      `${label}_DELETE_UNEXPECTEDLY_SUCCEEDED`,
    );
  } catch (error) {
    assert.equal(
      errorCode(error),
      "P2003",
      `${label}_MUST_FAIL_WITH_FOREIGN_KEY_RESTRICTION`,
    );
  }
}

async function main() {
  const prisma =
    new PrismaClient();

  try {
    console.log(
      "── SETUP ARCHIVAL FIXTURE ──",
    );

    const fixture =
      await prisma.$transaction(
        async (
          tx: ArchivalSetupClient,
        ) => {
          const actor =
            await tx.user.create({
              data: {
                username:
                  "sai-archive-operator",

                passwordHash:
                  "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

                email:
                  "sai-archive@example.invalid",

                isAdmin: true,

                viewedDocs: [],
              },
            });

          const established =
            await establishSourceAuthorityWithClient({
              client: tx,

              reference:
                "SMOKE-SAI-ARCHIVE-001",

              title:
                "SOURCE AUTHORITY ARCHIVAL FIXTURE",

              subject: {
                displayName:
                  "Archival Protection Fixture",

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
            });

          const version =
            await tx.instrumentVersion.findUniqueOrThrow({
              where: {
                instrumentId_number: {
                  instrumentId:
                    established.instrument.id,

                  number: 1,
                },
              },
            });

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
                "Archival Assertion",

              statement:
                "Assertion used to prove Source Authority archival deletion protection.",

              scope:
                "Archival smoke only.",

              ordinal: 1,

              actorUserId:
                actor.id,
            });

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
                  "Archival evidence fixture",

                recordedByUserId:
                  actor.id,
              },
            });

          const recognition =
            await recordSourceAuthorityRecognitionWithClient({
              client: tx,

              assertionId:
                assertionResult.assertion.id,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .RECOGNIZED,

              evidenceIds: [
                evidence.id,
              ],

              actorUserId:
                actor.id,
            });

          return {
            actorId:
              actor.id,

            instrumentId:
              established.instrument.id,

            versionId:
              version.id,

            assertionId:
              assertionResult.assertion.id,

            evidenceId:
              evidence.id,

            recognitionId:
              recognition.recognition.id,
          };
        },
      );

    console.log(
      "✓ canonical archival fixture committed",
    );

    console.log("");
    console.log(
      "── DELETE ATTEMPT 1: PARENT INSTRUMENT ──",
    );

    await expectForeignKeyRejection(
      "INSTITUTIONAL_INSTRUMENT",

      () =>
        prisma.institutionalInstrument.delete({
          where: {
            id:
              fixture.instrumentId,
          },
        }),
    );

    console.log(
      "✓ SAI root prevented parent instrument deletion",
    );

    console.log("");
    console.log(
      "── DELETE ATTEMPT 2: BOUND VERSION ──",
    );

    await expectForeignKeyRejection(
      "INSTRUMENT_VERSION",

      () =>
        prisma.instrumentVersion.delete({
          where: {
            id:
              fixture.versionId,
          },
        }),
    );

    console.log(
      "✓ Source Authority assertion prevented version deletion",
    );

    console.log("");
    console.log(
      "── DELETE ATTEMPT 3: RELIED-UPON EVIDENCE ──",
    );

    await expectForeignKeyRejection(
      "INSTRUMENT_EVIDENCE",

      () =>
        prisma.instrumentEvidence.delete({
          where: {
            id:
              fixture.evidenceId,
          },
        }),
    );

    console.log(
      "✓ recognition evidence link prevented evidence deletion",
    );

    console.log("");
    console.log(
      "── VERIFY COMPLETE GRAPH SURVIVED ──",
    );

    const [
      instrument,
      version,
      root,
      assertion,
      evidence,
      recognition,
      evidenceLink,
    ] =
      await Promise.all([
        prisma.institutionalInstrument.findUnique({
          where: {
            id:
              fixture.instrumentId,
          },
        }),

        prisma.instrumentVersion.findUnique({
          where: {
            id:
              fixture.versionId,
          },
        }),

        prisma.sourceAuthorityRecord.findUnique({
          where: {
            instrumentId:
              fixture.instrumentId,
          },
        }),

        prisma.sourceAuthorityAssertion.findUnique({
          where: {
            id:
              fixture.assertionId,
          },
        }),

        prisma.instrumentEvidence.findUnique({
          where: {
            id:
              fixture.evidenceId,
          },
        }),

        prisma.sourceAuthorityRecognition.findUnique({
          where: {
            id:
              fixture.recognitionId,
          },
        }),

        prisma.sourceAuthorityRecognitionEvidence.findUnique({
          where: {
            recognitionId_evidenceId: {
              recognitionId:
                fixture.recognitionId,

              evidenceId:
                fixture.evidenceId,
            },
          },
        }),
      ]);

    assert.ok(
      instrument,
      "INSTRUMENT_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      version,
      "VERSION_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      root,
      "SOURCE_AUTHORITY_ROOT_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      assertion,
      "ASSERTION_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      evidence,
      "EVIDENCE_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      recognition,
      "RECOGNITION_MISSING_AFTER_REJECTED_DELETE",
    );

    assert.ok(
      evidenceLink,
      "RECOGNITION_EVIDENCE_LINK_MISSING_AFTER_REJECTED_DELETE",
    );

    console.log(
      "✓ complete Source Authority archival graph remains intact",
    );

    console.log("");
    console.log(
      "✓ Source Authority archival protection smoke passed",
    );

    console.log({
      parentInstrumentDeletionRestricted:
        true,

      boundVersionDeletionRestricted:
        true,

      reliedUponEvidenceDeletionRestricted:
        true,

      archivalGraphRemainsIntact:
        true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
