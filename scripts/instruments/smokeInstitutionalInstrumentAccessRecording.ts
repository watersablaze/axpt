import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";
import {
  hashInstrumentAccessToken,
} from "../../src/domains/instruments/access/accessToken";
import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "../../src/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const TEST_REFERENCE =
  "GM-G2I2-ACCESS-SMOKE-001";

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
      "[GM_G2I_2_GM_SOURCE_NOT_FOUND]",
    );
  }

  const token =
    randomBytes(32).toString(
      "base64url",
    );

  const codeHash =
    hashInstrumentAccessToken(
      token,
    );

  const firstAt =
    new Date(
      "2026-09-19T20:00:00.000Z",
    );

  const secondAt =
    new Date(
      "2026-09-19T20:05:00.000Z",
    );

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
                "GM-G2I.2 Access Smoke",
              status:
                INSTITUTIONAL_INSTRUMENT_STATUS
                  .UNDER_DELIBERATION,
              currentVersion: 1,
              createdByUserId:
                gm.createdByUserId,
            },
            select: {
              id:
                true,
            },
          });

        const grant =
          await tx.instrumentAccessGrant.create({
            data: {
              instrumentId:
                instrument.id,
              recipientUserId:
                gm.createdByUserId,
              recipientName:
                "GM-G2I.2 Smoke Recipient",
              recipientRole:
                INSTRUMENT_PARTY_ROLE
                  .DELIBERATOR,
              accessLevel:
                INSTRUMENT_ACCESS_LEVEL
                  .DELIBERATE,
              codeHash,
              issuedByUserId:
                gm.createdByUserId,
              expiresAt:
                new Date(
                  "2026-09-20T20:00:00.000Z",
                ),
            },
            select: {
              id:
                true,
            },
          });

        return {
          instrumentId:
            instrument.id,
          grantId:
            grant.id,
        };
      },
    );

  console.log(
    "GM_G2I_2_TEMPORARY_ACCESS_FIXTURE_COMMITTED",
  );

  const first =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return resolveInstitutionalInstrumentAccessWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          token,
          at:
            firstAt,
          recordAccess:
            true,
        });
      },
    );

  if (!first) {
    throw new Error(
      "[GM_G2I_2_FIRST_ACCESS_NOT_RESOLVED]",
    );
  }

  console.log(
    JSON.stringify(
      {
        first,
      },
      null,
      2,
    ),
  );

  if (
    first.grant.firstAccessAt?.toISOString() !==
      firstAt.toISOString() ||
    first.grant.lastAccessAt?.toISOString() !==
      firstAt.toISOString()
  ) {
    throw new Error(
      "[GM_G2I_2_FIRST_ACCESS_TIMESTAMPS_INVALID]",
    );
  }

  const firstEventCount =
    await prisma.domainEvent.count({
      where: {
        streamId:
          setup.instrumentId,
        eventType:
          "INSTRUMENT_ACCESSED",
      },
    });

  if (
    firstEventCount !== 1
  ) {
    throw new Error(
      "[GM_G2I_2_FIRST_ACCESS_EVENT_INVALID]",
    );
  }

  console.log(
    "GM_G2I_2_FIRST_ACCESS_RECORDED",
  );

  const second =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return resolveInstitutionalInstrumentAccessWithClient({
          client:
            tx,
          instrumentReference:
            TEST_REFERENCE,
          token,
          at:
            secondAt,
          recordAccess:
            true,
        });
      },
    );

  if (!second) {
    throw new Error(
      "[GM_G2I_2_REPEAT_ACCESS_NOT_RESOLVED]",
    );
  }

  console.log(
    JSON.stringify(
      {
        second,
      },
      null,
      2,
    ),
  );

  if (
    second.grant.firstAccessAt?.toISOString() !==
      firstAt.toISOString()
  ) {
    throw new Error(
      "[GM_G2I_2_FIRST_ACCESS_OVERWRITTEN]",
    );
  }

  if (
    second.grant.lastAccessAt?.toISOString() !==
      secondAt.toISOString()
  ) {
    throw new Error(
      "[GM_G2I_2_LAST_ACCESS_NOT_ADVANCED]",
    );
  }

  const secondEventCount =
    await prisma.domainEvent.count({
      where: {
        streamId:
          setup.instrumentId,
        eventType:
          "INSTRUMENT_ACCESSED",
      },
    });

  if (
    secondEventCount !== 2
  ) {
    throw new Error(
      "[GM_G2I_2_REPEAT_ACCESS_EVENT_INVALID]",
    );
  }

  console.log(
    "GM_G2I_2_REPEAT_ACCESS_RECORDED",
  );

  console.log(
    "GM_G2I_2_ACCESS_EVENT_LIFECYCLE_VALID",
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
    },
  );

  console.log(
    "GM_G2I_2_CLEANUP_TRANSACTION_COMMITTED",
  );

  const [
    survivingInstrument,
    survivingGrant,
    survivingEvents,
  ] = await Promise.all([
    prisma.institutionalInstrument.count({
      where: {
        reference:
          TEST_REFERENCE,
      },
    }),

    prisma.instrumentAccessGrant.count({
      where: {
        id:
          setup.grantId,
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
        survivingInstrument,
        survivingGrant,
        survivingEvents,
      },
      null,
      2,
    ),
  );

  if (
    survivingInstrument !== 0 ||
    survivingGrant !== 0 ||
    survivingEvents !== 0
  ) {
    throw new Error(
      "[GM_G2I_2_CLEANUP_INCOMPLETE]",
    );
  }

  console.log(
    "GM_G2I_2_TEST_ARTIFACTS_REMOVED",
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
