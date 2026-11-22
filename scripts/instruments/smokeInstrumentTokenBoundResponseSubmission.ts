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
  ensureInstrumentParticipantIdentityWithClient,
} from "../../src/domains/instruments/commands/ensureInstrumentParticipantIdentityWithClient";

import {
  issueInstrumentAccessGrantWithClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";

import {
  submitInstrumentResponseWithTokenWithClient,
} from "../../src/domains/instruments/commands/submitInstrumentResponseWithTokenWithClient";

import {
  loadInstrumentDeliberationWithClient,
} from "../../src/domains/instruments/queries/loadInstrumentDeliberationWithClient";

import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const TEST_REFERENCE =
  "GM-G2K1-RESPONSE-SMOKE-001";

const TEST_EMAIL =
  "gm-g2k1-smoke@invalid.axpt.test";

async function main() {
  const gm =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference:
          "GM-KENYA-RCF-001",
      },
      select: {
        createdByUserId:
          true,
      },
    });

  if (!gm) {
    throw new Error(
      "[GM_G2K_1_GM_SOURCE_NOT_FOUND]",
    );
  }

  const setup =
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
                "GM-G2K.1 Response Smoke",
              status:
                INSTITUTIONAL_INSTRUMENT_STATUS
                  .UNDER_DELIBERATION,
              currentVersion:
                1,
              createdByUserId:
                gm.createdByUserId,
            },
            select: {
              id:
                true,
            },
          });

        const version =
          await tx.instrumentVersion.create({
            data: {
              instrumentId:
                instrument.id,
              number:
                1,
              status:
                INSTRUMENT_VERSION_STATUS
                  .ISSUED,
              createdByUserId:
                gm.createdByUserId,
            },
            select: {
              id:
                true,
            },
          });

        const proposition =
          await tx.instrumentProposition.create({
            data: {
              version: {
                connect: {
                  id:
                    version.id,
                },
              },
              reference:
                "TEST-01",
              domain:
                "TEST",
              title:
                "Temporary proposition",
              body:
                "Temporary proposition for token-bound response submission.",
              state:
                INSTRUMENT_PROPOSITION_STATE
                  .PROPOSED,
              ordinal:
                1,
            },
            select: {
              id:
                true,
            },
          });

        return {
          instrumentId:
            instrument.id,
          propositionId:
            proposition.id,
        };
      },
    );

  console.log(
    "GM_G2K_1_TEMPORARY_INSTRUMENT_COMMITTED",
  );

  const identity =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return ensureInstrumentParticipantIdentityWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          email:
            TEST_EMAIL,
          displayName:
            "GM-G2K.1 Smoke Deliberator",
          partyRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,
          createdByUserId:
            gm.createdByUserId,
        });
      },
    );

  console.log(
    "GM_G2K_1_IDENTITY_BOUND",
  );

  const issuance =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return issueInstrumentAccessGrantWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          recipientName:
            identity.party.displayName,
          recipientUserId:
            identity.user.id,
          recipientRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,
          accessLevel:
            INSTRUMENT_ACCESS_LEVEL
              .DELIBERATE,
          issuedByUserId:
            gm.createdByUserId,
          expiresAt:
            new Date(
              Date.now() +
              24 * 60 * 60 * 1000,
            ),
        });
      },
    );

  console.log(
    "GM_G2K_1_DELIBERATE_GRANT_ISSUED",
  );

  const first =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return submitInstrumentResponseWithTokenWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          token:
            issuance.token,
          propositionReference:
            "TEST-01",
          responseType:
            INSTRUMENT_RESPONSE_TYPE
              .ACKNOWLEDGE,
          note:
            "Receipt acknowledged.",
          correlationId:
            "GM-G2K1-FIRST",
          occurredAt:
            new Date(
              "2026-09-19T21:00:00.000Z",
            ),
        });
      },
    );

  if (
    first.access.actorUserId !==
      identity.user.id ||
    first.access.grantId !==
      issuance.grant.id
  ) {
    throw new Error(
      "[GM_G2K_1_ACTOR_ATTRIBUTION_INVALID]",
    );
  }

  console.log(
    "GM_G2K_1_TOKEN_BOUND_ACTOR_DERIVED",
  );

  const afterFirst =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        TEST_REFERENCE,
      actorUserId:
        identity.user.id,
    });

  if (!afterFirst) {
    throw new Error(
      "[GM_G2K_1_FIRST_PROJECTION_MISSING]",
    );
  }

  const firstProposition =
    afterFirst.propositions.find(
      proposition =>
        proposition.reference ===
        "TEST-01",
    );

  if (
    !firstProposition ||
    firstProposition.resolution !==
      "RECEIVED" ||
    firstProposition.response
      ?.responseType !==
      INSTRUMENT_RESPONSE_TYPE
        .ACKNOWLEDGE
  ) {
    throw new Error(
      "[GM_G2K_1_FIRST_RESOLUTION_INVALID]",
    );
  }

  console.log(
    "GM_G2K_1_ACKNOWLEDGEMENT_DURABLE",
  );

  await runInstrumentGovernanceTransaction(
    prisma,
    async (tx) => {
      return submitInstrumentResponseWithTokenWithClient({
        client:
          tx,
        instrumentReference:
          TEST_REFERENCE,
        token:
          issuance.token,
        propositionReference:
          "TEST-01",
        responseType:
          INSTRUMENT_RESPONSE_TYPE
            .AFFIRM,
        note:
          "Substantive alignment affirmed.",
        correlationId:
          "GM-G2K1-SECOND",
        occurredAt:
          new Date(
            "2026-09-19T21:05:00.000Z",
          ),
      });
    },
  );

  const afterSecond =
    await loadInstrumentDeliberationWithClient({
      client:
        prisma,
      instrumentReference:
        TEST_REFERENCE,
      actorUserId:
        identity.user.id,
    });

  if (!afterSecond) {
    throw new Error(
      "[GM_G2K_1_SECOND_PROJECTION_MISSING]",
    );
  }

  const secondProposition =
    afterSecond.propositions.find(
      proposition =>
        proposition.reference ===
        "TEST-01",
    );

  if (
    !secondProposition ||
    secondProposition.resolution !==
      "ALIGNED" ||
    secondProposition.response
      ?.responseType !==
      INSTRUMENT_RESPONSE_TYPE
        .AFFIRM
  ) {
    throw new Error(
      "[GM_G2K_1_SECOND_RESOLUTION_INVALID]",
    );
  }

  console.log(
    "GM_G2K_1_AFFIRMATION_DURABLE",
  );

  const responseHistory =
    await prisma.instrumentResponse.findMany({
      where: {
        propositionId:
          setup.propositionId,
        actorUserId:
          identity.user.id,
      },
      orderBy: {
        createdAt:
          "asc",
      },
      select: {
        id:
          true,
        responseType:
          true,
        supersededAt:
          true,
        supersedesResponseId:
          true,
      },
    });

  console.log(
    JSON.stringify(
      { responseHistory },
      null,
      2,
    ),
  );

  if (
    responseHistory.length !== 2 ||
    responseHistory[0]?.responseType !==
      INSTRUMENT_RESPONSE_TYPE
        .ACKNOWLEDGE ||
    !responseHistory[0]?.supersededAt ||
    responseHistory[1]?.responseType !==
      INSTRUMENT_RESPONSE_TYPE
        .AFFIRM ||
    responseHistory[1]?.supersedesResponseId !==
      responseHistory[0]?.id
  ) {
    throw new Error(
      "[GM_G2K_1_SUPERSESSION_HISTORY_INVALID]",
    );
  }

  console.log(
    "GM_G2K_1_RESPONSE_SUPERSESSION_VALID",
  );

  const eventTypes =
    (
      await prisma.domainEvent.findMany({
        where: {
          streamId:
            setup.instrumentId,
        },
        select: {
          eventType:
            true,
        },
        orderBy: {
          occurredAt:
            "asc",
        },
      })
    ).map(
      (
        event: {
          eventType: string;
        },
      ) =>
        event.eventType,
    );

  if (
    !eventTypes.includes(
      "INSTRUMENT_RESPONSE_RECORDED",
    ) ||
    !eventTypes.includes(
      "INSTRUMENT_RESPONSE_SUPERSEDED",
    )
  ) {
    throw new Error(
      "[GM_G2K_1_RESPONSE_EVENTS_MISSING]",
    );
  }

  console.log(
    "GM_G2K_1_RESPONSE_EVENT_LIFECYCLE_VALID",
  );

  await runInstrumentGovernanceTransaction(
    prisma,
    async (tx) => {
      await tx.domainEvent.deleteMany({
        where: {
          streamId:
            setup.instrumentId,
        },
      });

      await tx.institutionalInstrument.delete({
        where: {
          id:
            setup.instrumentId,
        },
      });

      await tx.user.delete({
        where: {
          id:
            identity.user.id,
        },
      });
    },
  );

  console.log(
    "GM_G2K_1_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    instrumentCount,
    userCount,
    responseCount,
    eventCount,
  ] =
    await Promise.all([
      prisma.institutionalInstrument.count({
        where: {
          reference:
            TEST_REFERENCE,
        },
      }),

      prisma.user.count({
        where: {
          email:
            TEST_EMAIL,
        },
      }),

      prisma.instrumentResponse.count({
        where: {
          actorUserId:
            identity.user.id,
        },
      }),

      prisma.domainEvent.count({
        where: {
          streamId:
            setup.instrumentId,
        },
      }),
    ]);

  if (
    instrumentCount !== 0 ||
    userCount !== 0 ||
    responseCount !== 0 ||
    eventCount !== 0
  ) {
    throw new Error(
      "[GM_G2K_1_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2K_1_TEST_ARTIFACTS_REMOVED",
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
