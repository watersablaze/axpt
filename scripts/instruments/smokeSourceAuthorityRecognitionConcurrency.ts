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
  type SourceAuthorityRecognitionRecordingClient,
} from "../../src/domains/instruments/source-authority/commands/recordSourceAuthorityRecognitionWithClient";

type SetupClient = Pick<
  PrismaClientType,
  | "user"
  | "institutionalInstrument"
  | "instrumentVersion"
  | "sourceAuthorityRecord"
  | "sourceAuthorityAssertion"
  | "instrumentEvidence"
  | "domainEvent"
>;

type TransactionClient =
  Pick<
    PrismaClientType,
    | "sourceAuthorityAssertion"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "instrumentEvidence"
    | "domainEvent"
  >;

type RecognitionSnapshot =
  Readonly<{
    id: string;
    currentSlot:
      | "CURRENT"
      | null;
    supersedesRecognitionId:
      | string
      | null;
  }>;

type RecognitionHistorySnapshot =
  RecognitionSnapshot &
  Readonly<{
    supersededBy:
      | Readonly<{
          id: string;
        }>
      | null;
  }>;

type RecognitionEventSnapshot =
  Readonly<{
    eventType: string;
  }>;

type Barrier = Readonly<{
  arrive: () => Promise<void>;
}>;

function createBarrier(
  participants: number,
): Barrier {
  let arrived = 0;

  let release:
    (() => void) | null = null;

  const released =
    new Promise<void>(
      (resolve) => {
        release = resolve;
      },
    );

  return {
    async arrive() {
      arrived += 1;

      if (arrived === participants) {
        release?.();
      }

      await released;
    },
  };
}

function messageOf(
  value: unknown,
): string {
  return value instanceof Error
    ? value.message
    : String(value);
}

/**
 * The command's first material recognition read is
 * SourceAuthorityAssertion.findUnique().
 *
 * This proxy lets the real Prisma query complete, then
 * pauses both independent transactions at the same point.
 * No production command code is changed for the test.
 */
function recognitionClientWithReadBarrier(
  tx: TransactionClient,
  barrier: Barrier,
): SourceAuthorityRecognitionRecordingClient {
  const assertionDelegate = {
    findUnique:
      async (
        args: Parameters<
          typeof tx.sourceAuthorityAssertion.findUnique
        >[0],
      ) => {
        const result =
          await tx
            .sourceAuthorityAssertion
            .findUnique(args);

        await barrier.arrive();

        return result;
      },
  };

  return {
    sourceAuthorityAssertion:
      assertionDelegate as unknown as
        SourceAuthorityRecognitionRecordingClient[
          "sourceAuthorityAssertion"
        ],

    sourceAuthorityRecognition:
      tx.sourceAuthorityRecognition,

    sourceAuthorityRecognitionEvidence:
      tx.sourceAuthorityRecognitionEvidence,

    instrumentEvidence:
      tx.instrumentEvidence,

    domainEvent:
      tx.domainEvent,
  };
}

async function main() {
  const prisma =
    new PrismaClient({
      transactionOptions: {
        maxWait: 15_000,
        timeout: 60_000,
      },
    });

  try {
    console.log(
      "── SETUP CANONICAL FIXTURE ──",
    );

    const fixture =
      await prisma.$transaction(
        async (tx: SetupClient) => {
          const actor =
            await tx.user.create({
              data: {
                username:
                  "sai-concurrency-operator",

                passwordHash:
                  "SMOKE_ONLY_NOT_A_REAL_CREDENTIAL",

                email:
                  "sai-concurrency@example.invalid",

                isAdmin: true,

                viewedDocs: [],
              },
            });

          const established =
            await establishSourceAuthorityWithClient({
              client: tx,

              reference:
                "SMOKE-SAI-CONCURRENCY-001",

              title:
                "SOURCE AUTHORITY CONCURRENCY FIXTURE",

              subject: {
                displayName:
                  "Concurrency Source Fixture",

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
                "Concurrency Assertion",

              statement:
                "Assertion used only for deterministic concurrency testing.",

              scope:
                "Concurrency smoke only.",

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
                  "Concurrency evidence fixture",

                recordedByUserId:
                  actor.id,
              },
            });

          return {
            actorId:
              actor.id,

            instrumentId:
              established.instrument.id,

            assertionId:
              assertionResult.assertion.id,

            evidenceId:
              evidence.id,
          };
        },
      );

    console.log(
      "✓ canonical concurrency fixture committed",
    );

    /*
     * ========================================================
     * RACE 1 — TWO FIRST RECOGNITIONS
     * ========================================================
     */

    console.log("");
    console.log(
      "── RACE 1: FIRST CURRENT RECOGNITION ──",
    );

    const firstBarrier =
      createBarrier(2);

    const firstWriter = (
      label: string,
    ) =>
      prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          const client =
            recognitionClientWithReadBarrier(
              tx,
              firstBarrier,
            );

          const result =
            await recordSourceAuthorityRecognitionWithClient({
              client,

              assertionId:
                fixture.assertionId,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .RECOGNIZED,

              evidenceIds: [
                fixture.evidenceId,
              ],

              actorUserId:
                fixture.actorId,
            });

          return {
            label,
            recognitionId:
              result.recognition.id,
          };
        },
        {
          timeout: 60_000,
        },
      );

    const firstRace =
      await Promise.allSettled([
        firstWriter("A"),
        firstWriter("B"),
      ]);

    const firstSuccesses =
      firstRace.filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          label: string;
          recognitionId: string;
        }> =>
          result.status ===
          "fulfilled",
      );

    const firstFailures =
      firstRace.filter(
        (
          result,
        ): result is PromiseRejectedResult =>
          result.status ===
          "rejected",
      );

    assert.equal(
      firstSuccesses.length,
      1,
      "FIRST_RACE_MUST_HAVE_ONE_SUCCESS",
    );

    assert.equal(
      firstFailures.length,
      1,
      "FIRST_RACE_MUST_HAVE_ONE_FAILURE",
    );

    assert.match(
      messageOf(
        firstFailures[0].reason,
      ),
      /SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_CONFLICT/,
    );

    const afterFirstRace =
      (
        await prisma
          .sourceAuthorityRecognition
          .findMany({
          where: {
            assertionId:
              fixture.assertionId,
          },

            orderBy: {
              createdAt: "asc",
            },
          })
      ) as readonly RecognitionSnapshot[];

    assert.equal(
      afterFirstRace.length,
      1,
      "FIRST_RACE_MUST_PERSIST_ONE_RECOGNITION",
    );

    assert.equal(
      afterFirstRace.filter(
        (recognition) =>
          recognition.currentSlot ===
          "CURRENT",
      ).length,
      1,
      "FIRST_RACE_MUST_HAVE_ONE_CURRENT_SLOT",
    );

    const predecessor =
      afterFirstRace[0];

    assert.equal(
      predecessor.currentSlot,
      "CURRENT",
    );

    console.log(
      "✓ first-recognition race: one winner",
    );

    console.log(
      "✓ first-recognition race: one CURRENT_SLOT_CONFLICT",
    );

    console.log(
      "✓ first-recognition race: exactly one durable CURRENT recognition",
    );

    /*
     * ========================================================
     * RACE 2 — TWO SUCCESSORS FOR ONE CURRENT PREDECESSOR
     * ========================================================
     */

    console.log("");
    console.log(
      "── RACE 2: CONCURRENT SUPERSESSION ──",
    );

    const supersessionBarrier =
      createBarrier(2);

    const successorWriter = (
      label: string,
      reason: string,
    ) =>
      prisma.$transaction(
        async (
          tx: TransactionClient,
        ) => {
          const client =
            recognitionClientWithReadBarrier(
              tx,
              supersessionBarrier,
            );

          const result =
            await recordSourceAuthorityRecognitionWithClient({
              client,

              assertionId:
                fixture.assertionId,

              outcome:
                SOURCE_AUTHORITY_RECOGNITION_OUTCOME
                  .NOT_RECOGNIZED,

              evidenceIds: [],

              reason,

              supersedesRecognitionId:
                predecessor.id,

              actorUserId:
                fixture.actorId,
            });

          return {
            label,
            recognitionId:
              result.recognition.id,
          };
        },
        {
          timeout: 60_000,
        },
      );

    const supersessionRace =
      await Promise.allSettled([
        successorWriter(
          "A",
          "Concurrent supersession candidate A.",
        ),

        successorWriter(
          "B",
          "Concurrent supersession candidate B.",
        ),
      ]);

    const successorSuccesses =
      supersessionRace.filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          label: string;
          recognitionId: string;
        }> =>
          result.status ===
          "fulfilled",
      );

    const successorFailures =
      supersessionRace.filter(
        (
          result,
        ): result is PromiseRejectedResult =>
          result.status ===
          "rejected",
      );

    assert.equal(
      successorSuccesses.length,
      1,
      "SUPERSESSION_RACE_MUST_HAVE_ONE_SUCCESS",
    );

    assert.equal(
      successorFailures.length,
      1,
      "SUPERSESSION_RACE_MUST_HAVE_ONE_FAILURE",
    );

    assert.match(
      messageOf(
        successorFailures[0].reason,
      ),
      /SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_CONCURRENCY_CONFLICT/,
    );

    const finalRecognitions =
      (
        await prisma
          .sourceAuthorityRecognition
          .findMany({
          where: {
            assertionId:
              fixture.assertionId,
          },

          include: {
            supersededBy: true,
          },

            orderBy: {
              createdAt: "asc",
            },
          })
      ) as readonly RecognitionHistorySnapshot[];

    assert.equal(
      finalRecognitions.length,
      2,
      "SUPERSESSION_RACE_MUST_LEAVE_TWO_TOTAL_RECOGNITIONS",
    );

    const historical =
      finalRecognitions.find(
        (recognition) =>
          recognition.id ===
          predecessor.id,
      );

    assert.ok(
      historical,
      "PREDECESSOR_MISSING",
    );

    assert.equal(
      historical.currentSlot,
      null,
      "PREDECESSOR_MUST_BE_HISTORICAL",
    );

    assert.ok(
      historical.supersededBy,
      "PREDECESSOR_MUST_HAVE_ONE_SUCCESSOR",
    );

    const current =
      finalRecognitions.filter(
        (recognition) =>
          recognition.currentSlot ===
          "CURRENT",
      );

    assert.equal(
      current.length,
      1,
      "SUPERSESSION_RACE_MUST_HAVE_ONE_CURRENT_SUCCESSOR",
    );

    assert.equal(
      current[0].supersedesRecognitionId,
      predecessor.id,
      "CURRENT_SUCCESSOR_MUST_SUPERSEDE_PREDECESSOR",
    );

    assert.equal(
      historical.supersededBy?.id,
      current[0].id,
      "SUPERSESSION_CHAIN_MUST_BE_SINGULAR",
    );

    console.log(
      "✓ supersession race: one CAS winner",
    );

    console.log(
      "✓ supersession race: one SUPERSESSION_CONCURRENCY_CONFLICT",
    );

    console.log(
      "✓ predecessor retired exactly once",
    );

    console.log(
      "✓ exactly one successor owns CURRENT slot",
    );

    console.log(
      "✓ supersession chain remains singular",
    );

    /*
     * Event history must also reflect only committed winners.
     */
    const events =
      (
        await prisma.domainEvent.findMany({
          where: {
            streamId:
              fixture.instrumentId,

            eventType: {
              in: [
                "SOURCE_AUTHORITY_RECOGNITION_RECORDED",
                "SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED",
              ],
            },
          },
        })
      ) as readonly RecognitionEventSnapshot[];

    const recordedCount =
      events.filter(
        (event) =>
          event.eventType ===
          "SOURCE_AUTHORITY_RECOGNITION_RECORDED",
      ).length;

    const supersededCount =
      events.filter(
        (event) =>
          event.eventType ===
          "SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED",
      ).length;

    assert.equal(
      recordedCount,
      2,
      "ONLY_TWO_COMMITTED_RECOGNITIONS_EXPECTED",
    );

    assert.equal(
      supersededCount,
      1,
      "ONLY_ONE_COMMITTED_SUPERSESSION_EXPECTED",
    );

    console.log(
      "✓ failed race writers left no event residue",
    );

    console.log("");
    console.log(
      "✓ Source Authority deterministic concurrency smoke passed",
    );

    console.log({
      firstRecognitionRace:
        true,

      exactlyOneInitialCurrent:
        true,

      currentSlotUniqueConstraint:
        true,

      supersessionCompareAndSet:
        true,

      exactlyOneSuccessor:
        true,

      singularRecognitionHistory:
        true,

      failedWriterAtomicity:
        true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main();
