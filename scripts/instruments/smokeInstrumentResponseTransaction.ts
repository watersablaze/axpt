import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
  INSTRUMENT_PROPOSITION_STATE,
  INSTRUMENT_RESPONSE_TYPE,
  INSTRUMENT_VERSION_STATUS,
} from "../../src/domains/instruments/contracts";
import {
  issueInstrumentAccessGrantWithClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import {
  recordInstrumentResponseWithClient,
} from "../../src/domains/instruments/commands/recordInstrumentResponseWithClient";
import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma = new PrismaClient();

const TEST_REFERENCE =
  "GM-G2E-RESPONSE-SMOKE-001";

const PROPOSITION_REFERENCE =
  "TEST-01";

async function main() {
  const gm =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference: "GM-KENYA-RCF-001",
      },
      select: {
        createdByUserId: true,
      },
    });

  if (!gm) {
    throw new Error(
      "[GM_G2E_GM_PROVENANCE_SOURCE_NOT_FOUND]",
    );
  }

  const actorUserId =
    gm.createdByUserId;

  /*
   * FIRST COMMIT:
   * temporary instrument
   * + version
   * + proposition
   * + identity-bound access grant
   * + first response
   * + events
   */
  const firstCommit =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        const instrument =
          await tx.institutionalInstrument.create({
            data: {
              reference:
                TEST_REFERENCE,
              kind:
                INSTITUTIONAL_INSTRUMENT_KIND
                  .GENERAL,
              title:
                "GM-G2E Response Smoke",
              status:
                INSTITUTIONAL_INSTRUMENT_STATUS
                  .UNDER_DELIBERATION,
              currentVersion: 1,
              createdByUserId:
                actorUserId,
            },
            select: {
              id: true,
              reference: true,
            },
          });

        const version =
          await tx.instrumentVersion.create({
            data: {
              instrumentId:
                instrument.id,
              number: 1,
              status:
                INSTRUMENT_VERSION_STATUS
                  .ISSUED,
              createdByUserId:
                actorUserId,
              issuedAt:
                new Date(),
            },
            select: {
              id: true,
              number: true,
            },
          });

        const proposition =
          await tx.instrumentProposition.create({
            data: {
              versionId:
                version.id,
              reference:
                PROPOSITION_REFERENCE,
              domain:
                "Transactional Smoke",
              title:
                "Response history proof",
              body:
                "Temporary proposition used only to prove durable response and supersession semantics.",
              state:
                INSTRUMENT_PROPOSITION_STATE
                  .PROPOSED,
              ordinal: 1,
            },
            select: {
              id: true,
              reference: true,
            },
          });

        const access =
          await issueInstrumentAccessGrantWithClient({
            client: tx,
            instrumentReference:
              TEST_REFERENCE,
            recipientName:
              "GM-G2E Smoke Actor",
            recipientUserId:
              actorUserId,
            recipientRole:
              INSTRUMENT_PARTY_ROLE
                .DELIBERATOR,
            accessLevel:
              INSTRUMENT_ACCESS_LEVEL
                .DELIBERATE,
            issuedByUserId:
              actorUserId,
            expiresAt:
              new Date(
                Date.now() +
                  60 * 60 * 1000,
              ),
          });

        const first =
          await recordInstrumentResponseWithClient({
            client: tx,
            instrumentReference:
              TEST_REFERENCE,
            propositionReference:
              PROPOSITION_REFERENCE,
            responseType:
              INSTRUMENT_RESPONSE_TYPE
                .AFFIRM,
            note:
              "Initial transactional response.",
            context: {
              actorUserId,
              accessGrantId:
                access.grant.id,
              correlationId:
                "GM-G2E-FIRST",
            },
          });

        const responseEvents =
          await tx.domainEvent.count({
            where: {
              streamId:
                instrument.id,
              eventType:
                "INSTRUMENT_RESPONSE_RECORDED",
            },
          });

        if (
          responseEvents !== 1
        ) {
          throw new Error(
            "[GM_G2E_FIRST_RESPONSE_EVENT_NOT_VISIBLE]",
          );
        }

        return {
          instrumentId:
            instrument.id,
          propositionId:
            proposition.id,
          accessGrantId:
            access.grant.id,
          firstResponseId:
            first.response.id,
        };
      },
    );

  console.log(
    "GM_G2E_FIRST_RESPONSE_TRANSACTION_COMMITTED",
  );

  const durableFirst =
    await prisma.instrumentResponse.findUnique({
      where: {
        id:
          firstCommit.firstResponseId,
      },
      select: {
        id: true,
        propositionId: true,
        actorUserId: true,
        responseType: true,
        note: true,
        supersedesResponseId: true,
        supersededAt: true,
      },
    });

  const firstEventCount =
    await prisma.domainEvent.count({
      where: {
        streamId:
          firstCommit.instrumentId,
        eventType:
          "INSTRUMENT_RESPONSE_RECORDED",
      },
    });

  console.log(
    JSON.stringify(
      {
        durableFirst,
        firstEventCount,
      },
      null,
      2,
    ),
  );

  if (
    !durableFirst ||
    durableFirst.responseType !==
      "AFFIRM" ||
    durableFirst.supersedesResponseId !==
      null ||
    durableFirst.supersededAt !==
      null ||
    firstEventCount !== 1
  ) {
    throw new Error(
      "[GM_G2E_FIRST_RESPONSE_NOT_DURABLE]",
    );
  }

  console.log(
    "GM_G2E_FIRST_RESPONSE_DURABLE",
  );

  /*
   * SECOND COMMIT:
   * second response by same actor
   * to same proposition.
   *
   * Prior response must become superseded,
   * never deleted.
   */
  const secondCommit =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        const second =
          await recordInstrumentResponseWithClient({
            client: tx,
            instrumentReference:
              TEST_REFERENCE,
            propositionReference:
              PROPOSITION_REFERENCE,
            responseType:
              INSTRUMENT_RESPONSE_TYPE
                .CLARIFY,
            note:
              "Superseding response used to prove preserved response history.",
            context: {
              actorUserId,
              accessGrantId:
                firstCommit.accessGrantId,
              correlationId:
                "GM-G2E-SECOND",
              causationId:
                firstCommit.firstResponseId,
            },
          });

        if (
          !second
            .supersededResponse
        ) {
          throw new Error(
            "[GM_G2E_PRIOR_RESPONSE_NOT_DETECTED]",
          );
        }

        return {
          secondResponseId:
            second.response.id,
        };
      },
    );

  console.log(
    "GM_G2E_SECOND_RESPONSE_TRANSACTION_COMMITTED",
  );

  const [
    firstAfter,
    secondAfter,
    recordedEventCount,
    supersededEventCount,
    totalResponses,
  ] = await Promise.all([
    prisma.instrumentResponse.findUnique({
      where: {
        id:
          firstCommit.firstResponseId,
      },
      select: {
        id: true,
        supersededAt: true,
      },
    }),

    prisma.instrumentResponse.findUnique({
      where: {
        id:
          secondCommit.secondResponseId,
      },
      select: {
        id: true,
        responseType: true,
        supersedesResponseId: true,
        supersededAt: true,
      },
    }),

    prisma.domainEvent.count({
      where: {
        streamId:
          firstCommit.instrumentId,
        eventType:
          "INSTRUMENT_RESPONSE_RECORDED",
      },
    }),

    prisma.domainEvent.count({
      where: {
        streamId:
          firstCommit.instrumentId,
        eventType:
          "INSTRUMENT_RESPONSE_SUPERSEDED",
      },
    }),

    prisma.instrumentResponse.count({
      where: {
        propositionId:
          firstCommit.propositionId,
        actorUserId,
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        firstAfter,
        secondAfter,
        recordedEventCount,
        supersededEventCount,
        totalResponses,
      },
      null,
      2,
    ),
  );

  if (
    !firstAfter?.supersededAt
  ) {
    throw new Error(
      "[GM_G2E_PRIOR_RESPONSE_NOT_SUPERSEDED]",
    );
  }

  if (
    !secondAfter ||
    secondAfter.responseType !==
      "CLARIFY" ||
    secondAfter.supersedesResponseId !==
      firstCommit.firstResponseId ||
    secondAfter.supersededAt !==
      null
  ) {
    throw new Error(
      "[GM_G2E_SUPERSEDING_RESPONSE_INVALID]",
    );
  }

  if (
    recordedEventCount !== 2 ||
    supersededEventCount !== 1 ||
    totalResponses !== 2
  ) {
    throw new Error(
      "[GM_G2E_RESPONSE_HISTORY_COUNTS_INVALID]",
    );
  }

  console.log(
    "GM_G2E_RESPONSE_HISTORY_PRESERVED",
  );

  console.log(
    "GM_G2E_SUPERSESSION_EVENTS_VALID",
  );

  /*
   * Cleanup is a separate transaction,
   * after durable commit proof.
   */
  await runInstrumentGovernanceTransaction(
    prisma,
    async (tx) => {
      await tx.domainEvent.deleteMany({
        where: {
          streamId:
            firstCommit.instrumentId,
        },
      });

      await tx.institutionalInstrument.delete({
        where: {
          id:
            firstCommit.instrumentId,
        },
      });
    },
  );

  console.log(
    "GM_G2E_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    survivingInstrument,
    survivingResponses,
    survivingEvents,
  ] = await Promise.all([
    prisma.institutionalInstrument.count({
      where: {
        reference:
          TEST_REFERENCE,
      },
    }),

    prisma.instrumentResponse.count({
      where: {
        proposition: {
          version: {
            instrument: {
              reference:
                TEST_REFERENCE,
            },
          },
        },
      },
    }),

    prisma.domainEvent.count({
      where: {
        streamId:
          firstCommit.instrumentId,
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        survivingInstrument,
        survivingResponses,
        survivingEvents,
      },
      null,
      2,
    ),
  );

  if (
    survivingInstrument !== 0 ||
    survivingResponses !== 0 ||
    survivingEvents !== 0
  ) {
    throw new Error(
      "[GM_G2E_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2E_TEST_ARTIFACTS_REMOVED",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
