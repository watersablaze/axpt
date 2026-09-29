import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";

import {
  ensureInstrumentParticipantIdentityWithClient,
} from "../../src/domains/instruments/commands/ensureInstrumentParticipantIdentityWithClient";

import {
  issueInstrumentAccessGrantWithClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";

import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "../../src/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";

import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const TEST_REFERENCE =
  "GM-G2J3-DELIBERATE-ACCESS-SMOKE-001";

const TEST_EMAIL =
  "gm-g2j3-smoke@invalid.axpt.test";

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
      "[GM_G2J_3_GM_SOURCE_NOT_FOUND]",
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
                "GM-G2J.3 Deliberate Access Smoke",
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
    "GM_G2J_3_TEMPORARY_INSTRUMENT_COMMITTED",
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
            "GM-G2J.3 Smoke Deliberator",
          partyRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,
          createdByUserId:
            gm.createdByUserId,
        });
      },
    );

  if (
    !identity.party.userId ||
    identity.party.userId !==
      identity.user.id ||
    identity.party.role !==
      INSTRUMENT_PARTY_ROLE
        .DELIBERATOR
  ) {
    throw new Error(
      "[GM_G2J_3_IDENTITY_BINDING_INVALID]",
    );
  }

  console.log(
    "GM_G2J_3_IDENTITY_BOUND",
  );

  const expiresAt =
    new Date(
      Date.now() +
      24 * 60 * 60 * 1000,
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
          expiresAt,
        });
      },
    );

  if (
    issuance.grant.recipientUserId !==
      identity.user.id ||
    issuance.grant.recipientRole !==
      INSTRUMENT_PARTY_ROLE
        .DELIBERATOR ||
    issuance.grant.accessLevel !==
      INSTRUMENT_ACCESS_LEVEL
        .DELIBERATE
  ) {
    throw new Error(
      "[GM_G2J_3_GRANT_IDENTITY_BINDING_INVALID]",
    );
  }

  if (!issuance.token) {
    throw new Error(
      "[GM_G2J_3_RAW_TOKEN_MISSING]",
    );
  }

  console.log(
    "GM_G2J_3_DELIBERATE_GRANT_ISSUED",
  );

  const persistedGrant =
    await prisma.instrumentAccessGrant.findUnique({
      where: {
        id:
          issuance.grant.id,
      },
      select: {
        id: true,
        recipientUserId: true,
        recipientName: true,
        recipientRole: true,
        accessLevel: true,
        codeHash: true,
        firstAccessAt: true,
        lastAccessAt: true,
      },
    });

  if (
    !persistedGrant ||
    !persistedGrant.codeHash ||
    persistedGrant.codeHash ===
      issuance.token ||
    persistedGrant.recipientUserId !==
      identity.user.id
  ) {
    throw new Error(
      "[GM_G2J_3_TOKEN_PERSISTENCE_BOUNDARY_INVALID]",
    );
  }

  console.log(
    "GM_G2J_3_RAW_TOKEN_NOT_PERSISTED",
  );

  const resolution =
    await resolveInstitutionalInstrumentAccessWithClient({
      client:
        prisma,
      instrumentReference:
        TEST_REFERENCE,
      token:
        issuance.token,
      recordAccess:
        false,
    });

  if (
    !resolution ||
    resolution.instrument.reference !==
      TEST_REFERENCE ||
    resolution.grant.id !==
      issuance.grant.id ||
    resolution.grant.recipientUserId !==
      identity.user.id ||
    resolution.grant.accessLevel !==
      INSTRUMENT_ACCESS_LEVEL
        .DELIBERATE
  ) {
    throw new Error(
      "[GM_G2J_3_ACCESS_RESOLUTION_INVALID]",
    );
  }

  console.log(
    "GM_G2J_3_IDENTITY_BOUND_ACCESS_RESOLVED",
  );

  const beforeRecording =
    await prisma.instrumentAccessGrant.findUnique({
      where: {
        id:
          issuance.grant.id,
      },
      select: {
        firstAccessAt:
          true,
        lastAccessAt:
          true,
      },
    });

  if (
    !beforeRecording ||
    beforeRecording.firstAccessAt !==
      null ||
    beforeRecording.lastAccessAt !==
      null
  ) {
    throw new Error(
      "[GM_G2J_3_RESOLUTION_MUTATED_ACCESS]",
    );
  }

  console.log(
    "GM_G2J_3_RESOLUTION_REMAINED_READ_ONLY",
  );

  const accessedAt =
    new Date();

  const recorded =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return resolveInstitutionalInstrumentAccessWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          token:
            issuance.token,
          at:
            accessedAt,
          recordAccess:
            true,
        });
      },
    );

  if (
    !recorded ||
    recorded.grant.recipientUserId !==
      identity.user.id ||
    recorded.grant.firstAccessAt?.getTime() !==
      accessedAt.getTime() ||
    recorded.grant.lastAccessAt?.getTime() !==
      accessedAt.getTime()
  ) {
    throw new Error(
      "[GM_G2J_3_ACCESS_RECORDING_INVALID]",
    );
  }

  console.log(
    "GM_G2J_3_ACCESS_RECORDING_BOUNDARY_VALID",
  );

  const events =
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
    });

  type InstrumentEventRow = {
    eventType: string;
  };

  const eventTypes =
    (events as InstrumentEventRow[]).map(
      (
        event:
          InstrumentEventRow,
      ) =>
        event.eventType,
    );

  console.log(
    JSON.stringify(
      {
        eventTypes,
      },
      null,
      2,
    ),
  );

  if (
    !eventTypes.includes(
      "INSTRUMENT_PARTY_BOUND",
    ) ||
    !eventTypes.includes(
      "INSTRUMENT_ACCESS_GRANTED",
    ) ||
    !eventTypes.includes(
      "INSTRUMENT_ACCESSED",
    )
  ) {
    throw new Error(
      "[GM_G2J_3_EVENT_LIFECYCLE_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2J_3_EVENT_LIFECYCLE_VALID",
  );

  const participant =
    await prisma.user.findUnique({
      where: {
        id:
          identity.user.id,
      },
      select: {
        isAdmin:
          true,
        userRoles: {
          select: {
            id:
              true,
          },
        },
        wallets: {
          select: {
            id:
              true,
          },
        },
        sessions: {
          select: {
            id:
              true,
          },
        },
      },
    });

  if (
    !participant ||
    participant.isAdmin ||
    participant.userRoles.length !==
      0 ||
    participant.wallets !==
      null ||
    participant.sessions.length !==
      0
  ) {
    throw new Error(
      "[GM_G2J_3_IDENTITY_SCOPE_VIOLATION]",
    );
  }

  console.log(
    "GM_G2J_3_EXTERNAL_IDENTITY_SCOPE_PRESERVED",
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
    "GM_G2J_3_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    instrumentCount,
    userCount,
    grantCount,
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

      prisma.instrumentAccessGrant.count({
        where: {
          id:
            issuance.grant.id,
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
    grantCount !== 0 ||
    eventCount !== 0
  ) {
    throw new Error(
      "[GM_G2J_3_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2J_3_TEST_ARTIFACTS_REMOVED",
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
