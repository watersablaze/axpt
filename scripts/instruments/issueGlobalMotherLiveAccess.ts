import { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";

import {
  issueInstrumentAccessGrantWithClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";

import {
  runInstrumentGovernanceTransaction,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const REFERENCE =
  "GM-KENYA-RCF-001";

const EMAIL =
  "awulahnaanii@gmail.com";

const DISPLAY_NAME =
  "Dr. Awulah Naanii Amon AKA Nubian Empress Omaedro II";

const ACCESS_DAYS =
  14;

const PUBLIC_ORIGIN =
  process.env.AXPT_PUBLIC_ORIGIN?.replace(
    /\/+$/,
    "",
  ) ??
  "https://axpt.io";

async function main() {
  const now =
    new Date();

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          EMAIL,
      },
      select: {
        id:
          true,
        email:
          true,
        displayName:
          true,
        isAdmin:
          true,

        instrumentParties: {
          where: {
            instrument: {
              reference:
                REFERENCE,
            },
          },
          select: {
            id:
              true,
            displayName:
              true,
            role:
              true,
            authorityClass:
              true,
          },
        },

        instrumentAccessGrantsReceived: {
          where: {
            instrument: {
              reference:
                REFERENCE,
            },
            revokedAt:
              null,
            OR: [
              {
                expiresAt:
                  null,
              },
              {
                expiresAt: {
                  gt:
                    now,
                },
              },
            ],
          },
          select: {
            id:
              true,
            accessLevel:
              true,
            recipientRole:
              true,
            issuedAt:
              true,
            expiresAt:
              true,
          },
        },
      },
    });

  if (!user) {
    throw new Error(
      "GM_G2L_2_GLOBAL_MOTHER_USER_NOT_FOUND",
    );
  }

  if (user.isAdmin) {
    throw new Error(
      "GM_G2L_2_EXTERNAL_IDENTITY_IS_ADMIN",
    );
  }

  if (
    user.instrumentParties.length !==
      1
  ) {
    throw new Error(
      "GM_G2L_2_PARTY_BINDING_UNEXPECTED",
    );
  }

  const party =
    user.instrumentParties[0];

  if (
    party.role !==
      INSTRUMENT_PARTY_ROLE
        .DELIBERATOR ||
    party.authorityClass !==
      null
  ) {
    throw new Error(
      "GM_G2L_2_PARTY_SCOPE_INVALID",
    );
  }

  /*
   * Do not silently issue multiple valid bearer
   * grants for the first live participant.
   */
  if (
    user
      .instrumentAccessGrantsReceived
      .length !== 0
  ) {
    console.log(
      JSON.stringify(
        {
          existingActiveGrants:
            user.instrumentAccessGrantsReceived,
        },
        null,
        2,
      ),
    );

    throw new Error(
      "GM_G2L_2_ACTIVE_GRANT_ALREADY_EXISTS",
    );
  }

  const instrument =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference:
          REFERENCE,
      },
      select: {
        id:
          true,
        status:
          true,
        createdByUserId:
          true,

        _count: {
          select: {
            authorities:
              true,
          },
        },
      },
    });

  if (!instrument) {
    throw new Error(
      "GM_G2L_2_INSTRUMENT_NOT_FOUND",
    );
  }

  if (
    instrument.status !==
      "UNDER_DELIBERATION"
  ) {
    throw new Error(
      "GM_G2L_2_INSTRUMENT_NOT_UNDER_DELIBERATION",
    );
  }

  if (
    instrument._count.authorities !==
      0
  ) {
    throw new Error(
      "GM_G2L_2_UNEXPECTED_AUTHORITY_PRESENT",
    );
  }

  const expiresAt =
    new Date(
      now.getTime() +
      ACCESS_DAYS *
        24 *
        60 *
        60 *
        1000,
    );

  const issuance =
    await runInstrumentGovernanceTransaction(
      prisma,
      async tx => {
        return issueInstrumentAccessGrantWithClient({
          client:
            tx,

          instrumentReference:
            REFERENCE,

          recipientName:
            DISPLAY_NAME,

          recipientUserId:
            user.id,

          recipientRole:
            INSTRUMENT_PARTY_ROLE
              .DELIBERATOR,

          accessLevel:
            INSTRUMENT_ACCESS_LEVEL
              .DELIBERATE,

          issuedByUserId:
            instrument.createdByUserId,

          expiresAt,
        });
      },
    );

  const privatePath =
    `/french-ward/instruments/gm-kenya/access/${issuance.token}`;

  const privateUrl =
    `${PUBLIC_ORIGIN}${privatePath}`;

  console.log();
  console.log(
    "GM_G2L_2_LIVE_DELIBERATE_GRANT_ISSUED",
  );

  console.log(
    JSON.stringify(
      {
        grant: {
          id:
            issuance.grant.id,
          recipientUserId:
            issuance.grant
              .recipientUserId,
          recipientName:
            issuance.grant
              .recipientName,
          recipientRole:
            issuance.grant
              .recipientRole,
          accessLevel:
            issuance.grant
              .accessLevel,
          expiresAt:
            issuance.grant
              .expiresAt
              ?.toISOString() ??
            null,
        },
      },
      null,
      2,
    ),
  );

  console.log();
  console.log(
    "════════ PRIVATE INVITATION URL — COPY ONCE ════════",
  );

  console.log(
    privateUrl,
  );

  console.log(
    "════════ END PRIVATE INVITATION URL ═══════════════",
  );

  console.log();
  console.log(
    "GM_G2L_2_RAW_TOKEN_RETURNED_ONCE",
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
