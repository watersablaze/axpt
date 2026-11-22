import {
  PrismaClient,
} from "@prisma/client";

import {
  createGlobalMotherV4DraftWithClient,
} from "../../src/domains/instruments/commands/createGlobalMotherV4DraftWithClient";

import {
  globalMotherV4Definition,
} from "../../src/domains/instruments/definitions/globalMotherV4Definition";

import type {
  InstrumentGovernanceTransactionClient,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

async function main() {
  const actor =
    await prisma.user.findUnique({
      where: {
        email:
          "connect@axpt.io",
      },

      select: {
        id:
          true,

        email:
          true,

        isAdmin:
          true,
      },
    });

  if (
    !actor ||
    !actor.isAdmin
  ) {
    throw new Error(
      "GM_V4_DRAFT_ACTOR_NOT_AUTHORIZED",
    );
  }

  const existing =
    await prisma
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            globalMotherV4Definition
              .reference,
        },

        select: {
          currentVersion:
            true,

          status:
            true,

          versions: {
            where: {
              number:
                globalMotherV4Definition
                  .version,
            },

            select: {
              id:
                true,

              status:
                true,
            },
          },
        },
      });

  if (!existing) {
    throw new Error(
      "GM_V4_DRAFT_INSTRUMENT_NOT_FOUND",
    );
  }

  if (
    existing.currentVersion !== 3 ||
    existing.status !==
      "UNDER_DELIBERATION" ||
    existing.versions.length !== 0
  ) {
    console.error(
      JSON.stringify(
        existing,
        null,
        2,
      ),
    );

    throw new Error(
      "GM_V4_DRAFT_SCRIPT_PRECONDITION_FAILED",
    );
  }

  const result =
    await prisma.$transaction(
      async (
        tx:
          InstrumentGovernanceTransactionClient,
      ) =>
        createGlobalMotherV4DraftWithClient({
          client:
            tx,

          actorUserId:
            actor.id,

          correlationId:
            `gm-v4-draft:${Date.now()}`,
        }),
      {
        maxWait:
          30_000,

        timeout:
          60_000,
      },
    );

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );

  console.log();
  console.log(
    "GM_V4_DRAFT_CREATED",
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(
    () =>
      prisma.$disconnect(),
  );
