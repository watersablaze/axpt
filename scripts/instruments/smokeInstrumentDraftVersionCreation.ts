import {
  PrismaClient,
} from "@prisma/client";

import {
  randomUUID,
} from "node:crypto";

import {
  createInstrumentDraftVersionWithClient,
} from "../../src/domains/instruments/commands/createInstrumentDraftVersionWithClient";

import {
  runInstrumentGovernanceTransaction,
  type InstrumentGovernanceTransactionClient,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

async function main() {
  const creator =
    await prisma.user.findFirst({
      where: {
        isAdmin:
          true,
      },

      select: {
        id:
          true,
      },
    });

  if (!creator) {
    throw new Error(
      "GM_G2M_2A_SMOKE_CREATOR_MISSING",
    );
  }

  const reference =
    `SMOKE-VERSION-${randomUUID()}`;

  const instrument =
    await prisma.$transaction(
      async (
        tx:
          InstrumentGovernanceTransactionClient,
      ) => {
        return tx
          .institutionalInstrument
          .create({
            data: {
              reference,

              kind:
                "GENERAL",

              title:
                "Draft Version Smoke",

              status:
                "UNDER_DELIBERATION",

              currentVersion:
                1,

              createdByUserId:
                creator.id,

              versions: {
                create: {
                  number:
                    1,

                  status:
                    "ISSUED",

                  createdByUserId:
                    creator.id,

                  issuedAt:
                    new Date(),

                  propositions: {
                    create: [
                      {
                        reference:
                          "TEST-01",

                        domain:
                          "Test",

                        title:
                          "First proposition",

                        body:
                          "Issued source proposition.",

                        state:
                          "PROPOSED",

                        ordinal:
                          1,
                      },
                      {
                        reference:
                          "TEST-02",

                        domain:
                          "Test",

                        title:
                          "Second proposition",

                        body:
                          "Second issued source proposition.",

                        state:
                          "OPEN",

                        ordinal:
                          2,
                      },
                    ],
                  },
                },
              },
            },

            select: {
              id:
                true,

              currentVersion:
                true,
            },
          });
      },
    );

  console.log(
    "GM_G2M_2A_TEMPORARY_INSTRUMENT_COMMITTED",
  );

  const result =
    await runInstrumentGovernanceTransaction(
      prisma,
      async tx => {
        return createInstrumentDraftVersionWithClient({
          client:
            tx,

          instrumentReference:
            reference,

          createdByUserId:
            creator.id,

          correlationId:
            randomUUID(),
        });
      },
    );

  if (
    result.instrument.currentVersion !==
      1
  ) {
    throw new Error(
      "GM_G2M_2A_CURRENT_VERSION_MUTATED",
    );
  }

  if (
    result.sourceVersion.number !==
      1 ||
    result.sourceVersion.status !==
      "ISSUED"
  ) {
    throw new Error(
      "GM_G2M_2A_SOURCE_VERSION_INVALID",
    );
  }

  if (
    result.draft.number !==
      2 ||
    result.draft.status !==
      "DRAFT"
  ) {
    throw new Error(
      "GM_G2M_2A_DRAFT_VERSION_INVALID",
    );
  }

  if (
    result.draft.propositions.length !==
      2
  ) {
    throw new Error(
      "GM_G2M_2A_PROPOSITION_CLONE_INVALID",
    );
  }

  console.log(
    "GM_G2M_2A_DRAFT_VERSION_CREATED",
  );

  console.log(
    "GM_G2M_2A_CURRENT_VERSION_PRESERVED",
  );

  console.log(
    "GM_G2M_2A_PROPOSITIONS_CLONED",
  );

  const responseCount =
    await prisma.instrumentResponse.count({
      where: {
        proposition: {
          version: {
            instrumentId:
              instrument.id,
          },
        },
      },
    });

  if (
    responseCount !==
      0
  ) {
    throw new Error(
      "GM_G2M_2A_RESPONSE_COPIED"
    );
  }

  console.log(
    "GM_G2M_2A_RESPONSES_NOT_COPIED",
  );

  const event =
    await prisma.domainEvent.findFirst({
      where: {
        streamId:
          instrument.id,

        eventType:
          "INSTRUMENT_VERSION_CREATED",
      },

      orderBy: {
        occurredAt:
          "desc",
      },
    });

  if (!event) {
    throw new Error(
      "GM_G2M_2A_VERSION_EVENT_MISSING"
    );
  }

  console.log(
    "GM_G2M_2A_VERSION_EVENT_VALID",
  );

  await prisma.$transaction(
    async (
      tx:
        InstrumentGovernanceTransactionClient,
    ) => {
      await tx
        .institutionalInstrument
        .delete({
          where: {
            id:
              instrument.id,
          },
        });

      await tx
        .domainEvent
        .deleteMany({
          where: {
            streamId:
              instrument.id,
          },
        });
    },
  );

  console.log(
    "GM_G2M_2A_TEST_ARTIFACTS_REMOVED",
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
