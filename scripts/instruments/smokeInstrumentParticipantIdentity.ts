import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";

import {
  ensureInstrumentParticipantIdentityWithClient,
} from "../../src/domains/instruments/commands/ensureInstrumentParticipantIdentityWithClient";

import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const TEST_REFERENCE =
  "GM-G2J2-IDENTITY-SMOKE-001";

const TEST_EMAIL =
  "gm-g2j2-smoke@invalid.axpt.test";

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
      "[GM_G2J_2_GM_SOURCE_NOT_FOUND]",
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
                "GM-G2J.2 Identity Smoke",
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

        return {
          instrumentId:
            instrument.id,
        };
      },
    );

  console.log(
    "GM_G2J_2_TEMPORARY_INSTRUMENT_COMMITTED",
  );

  const first =
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
            "GM-G2J.2 Smoke Deliberator",
          partyRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,
          createdByUserId:
            gm.createdByUserId,
          occurredAt:
            new Date(
              "2026-09-19T20:30:00.000Z",
            ),
        });
      },
    );

  console.log(
    JSON.stringify(
      { first },
      null,
      2,
    ),
  );

  if (
    !first.identityCreated ||
    !first.partyCreated ||
    !first.party.userId ||
    first.user.isAdmin
  ) {
    throw new Error(
      "[GM_G2J_2_FIRST_IDENTITY_RESULT_INVALID]",
    );
  }

  console.log(
    "GM_G2J_2_EXTERNAL_IDENTITY_CREATED",
  );

  console.log(
    "GM_G2J_2_PARTY_BOUND",
  );

  const createdUser =
    await prisma.user.findUnique({
      where: {
        id:
          first.user.id,
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        tier: true,
        userRoles: {
          select: {
            id: true,
          },
        },
        wallets: {
          select: {
            id: true,
          },
        },
        sessions: {
          select: {
            id: true,
          },
        },
        metadata: true,
      },
    });

  console.log(
    JSON.stringify(
      { createdUser },
      null,
      2,
    ),
  );

  if (
    !createdUser ||
    createdUser.isAdmin ||
    createdUser.userRoles.length !== 0 ||
    createdUser.wallets !== null ||
    createdUser.sessions.length !== 0
  ) {
    throw new Error(
      "[GM_G2J_2_IDENTITY_SCOPE_VIOLATION]",
    );
  }

  console.log(
    "GM_G2J_2_NO_ROLE_ASSIGNED",
  );

  console.log(
    "GM_G2J_2_NO_WALLET_CREATED",
  );

  console.log(
    "GM_G2J_2_NO_SESSION_CREATED",
  );

  const second =
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
            "GM-G2J.2 Smoke Deliberator",
          partyRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,
          createdByUserId:
            gm.createdByUserId,
        });
      },
    );

  if (
    second.identityCreated ||
    second.partyCreated ||
    second.user.id !==
      first.user.id ||
    second.party.id !==
      first.party.id
  ) {
    throw new Error(
      "[GM_G2J_2_IDEMPOTENCY_INVALID]",
    );
  }

  console.log(
    "GM_G2J_2_IDENTITY_BINDING_IDEMPOTENT",
  );

  const eventCount =
    await prisma.domainEvent.count({
      where: {
        streamId:
          setup.instrumentId,
        eventType:
          "INSTRUMENT_PARTY_BOUND",
      },
    });

  if (eventCount !== 1) {
    throw new Error(
      "[GM_G2J_2_PARTY_EVENT_COUNT_INVALID]",
    );
  }

  console.log(
    "GM_G2J_2_PARTY_EVENT_VALID",
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
            first.user.id,
        },
      });
    },
  );

  console.log(
    "GM_G2J_2_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    instrumentCount,
    userCount,
    eventCountAfter,
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

      prisma.domainEvent.count({
        where: {
          streamId:
            setup.instrumentId,
        },
      }),
    ]);

  console.log(
    JSON.stringify(
      {
        instrumentCount,
        userCount,
        eventCountAfter,
      },
      null,
      2,
    ),
  );

  if (
    instrumentCount !== 0 ||
    userCount !== 0 ||
    eventCountAfter !== 0
  ) {
    throw new Error(
      "[GM_G2J_2_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2J_2_TEST_ARTIFACTS_REMOVED",
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
