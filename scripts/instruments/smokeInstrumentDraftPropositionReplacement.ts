import {
  PrismaClient,
} from "@prisma/client";

import type {
  InstrumentGovernanceTransactionClient,
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

import {
  randomUUID,
} from "node:crypto";

import {
  replaceInstrumentDraftPropositionsWithClient,
} from "../../src/domains/instruments/commands/replaceInstrumentDraftPropositionsWithClient";

const prisma =
  new PrismaClient();

const ROLLBACK_SENTINEL =
  "GM_G2M_4A_ROLLBACK_SENTINEL";

type SmokeVersionRow = Readonly<{
  number: number;
  status: string;
  propositions: readonly Readonly<{
    reference: string;
    title: string;
  }>[];
}>;

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
      "GM_G2M_4A_CREATOR_MISSING",
    );
  }

  const reference =
    `SMOKE-DRAFT-REVISION-${randomUUID()}`;

  let rollbackObserved =
    false;

  try {
    await prisma.$transaction(
      async (
        tx:
          InstrumentGovernanceTransactionClient,
      ) => {
        const instrument =
          await tx
            .institutionalInstrument
            .create({
              data: {
                reference,

                kind:
                  "GENERAL",

                title:
                  "Draft Revision Smoke",

                status:
                  "UNDER_DELIBERATION",

                currentVersion:
                  1,

                createdByUserId:
                  creator.id,

                versions: {
                  create: [
                    {
                      number:
                        1,

                      status:
                        "ISSUED",

                      createdByUserId:
                        creator.id,

                      issuedAt:
                        new Date(),

                      propositions: {
                        create: {
                          reference:
                            "LIVE-01",

                          domain:
                            "Live",

                          title:
                            "Issued proposition",

                          body:
                            "Issued proposition remains untouched.",

                          state:
                            "PROPOSED",

                          ordinal:
                            1,
                        },
                      },
                    },

                    {
                      number:
                        2,

                      status:
                        "DRAFT",

                      createdByUserId:
                        creator.id,

                      propositions: {
                        create: {
                          reference:
                            "OLD-01",

                          domain:
                            "Draft",

                          title:
                            "Old draft proposition",

                          body:
                            "To be replaced.",

                          state:
                            "OPEN",

                          ordinal:
                            1,
                        },
                      },
                    },
                  ],
                },
              },

              select: {
                id:
                  true,
              },
            });

        console.log(
          "GM_G2M_4A_SMOKE_INSTRUMENT_CREATED_INSIDE_TRANSACTION",
        );

        const result =
          await replaceInstrumentDraftPropositionsWithClient({
            client:
              tx,

            instrumentReference:
              reference,

            versionNumber:
              2,

            propositions: [
              {
                reference:
                  "NEW-01",

                domain:
                  "Draft",

                title:
                  "First new proposition",

                body:
                  "First replacement proposition.",

                state:
                  "PROPOSED",

                ordinal:
                  1,
              },

              {
                reference:
                  "NEW-02",

                domain:
                  "Draft",

                title:
                  "Second new proposition",

                body:
                  "Second replacement proposition.",

                state:
                  "OPEN",

                ordinal:
                  2,
              },
            ],
          });

        if (
          result.currentVersion !==
            1
        ) {
          throw new Error(
            "GM_G2M_4A_CURRENT_VERSION_CHANGED",
          );
        }

        if (
          result.version.number !==
            2 ||
          result.version.status !==
            "DRAFT" ||
          result.version.propositions.length !==
            2
        ) {
          throw new Error(
            "GM_G2M_4A_REPLACEMENT_INVALID",
          );
        }

        const after =
          await tx
            .institutionalInstrument
            .findUnique({
              where: {
                id:
                  instrument.id,
              },

              select: {
                currentVersion:
                  true,

                versions: {
                  orderBy: {
                    number:
                      "asc",
                  },

                  select: {
                    number:
                      true,

                    status:
                      true,

                    propositions: {
                      orderBy: {
                        ordinal:
                          "asc",
                      },

                      select: {
                        reference:
                          true,

                        title:
                          true,
                      },
                    },
                  },
                },
              },
            });

        const v1 =
          after?.versions.find(
            (
              version:
                SmokeVersionRow,
            ) =>
              version.number === 1,
          );

        const v2 =
          after?.versions.find(
            (
              version:
                SmokeVersionRow,
            ) =>
              version.number === 2,
          );

        if (
          !after ||
          after.currentVersion !==
            1 ||
          !v1 ||
          v1.status !==
            "ISSUED" ||
          v1.propositions.length !==
            1 ||
          v1.propositions[0]
            ?.reference !==
            "LIVE-01" ||
          !v2 ||
          v2.status !==
            "DRAFT" ||
          v2.propositions.length !==
            2 ||
          v2.propositions[0]
            ?.reference !==
            "NEW-01" ||
          v2.propositions[1]
            ?.reference !==
            "NEW-02"
        ) {
          throw new Error(
            "GM_G2M_4A_VERSION_BOUNDARY_BROKEN",
          );
        }

        console.log(
          "GM_G2M_4A_DRAFT_REPLACED_INSIDE_TRANSACTION",
        );

        console.log(
          "GM_G2M_4A_ISSUED_VERSION_UNTOUCHED_INSIDE_TRANSACTION",
        );

        console.log(
          "GM_G2M_4A_CURRENT_VERSION_PRESERVED_INSIDE_TRANSACTION",
        );

        /*
         * Intentional rollback.
         * Nothing created or replaced by this
         * smoke may survive the transaction.
         */
        throw new Error(
          ROLLBACK_SENTINEL,
        );
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        ROLLBACK_SENTINEL
    ) {
      rollbackObserved =
        true;

      console.log(
        "GM_G2M_4A_EXPECTED_ROLLBACK_OBSERVED",
      );
    } else {
      throw error;
    }
  }

  if (!rollbackObserved) {
    throw new Error(
      "GM_G2M_4A_EXPECTED_ROLLBACK_NOT_OBSERVED",
    );
  }

  const persisted =
    await prisma
      .institutionalInstrument
      .findUnique({
        where: {
          reference,
        },

        select: {
          id:
            true,
        },
      });

  if (persisted) {
    throw new Error(
      "GM_G2M_4A_ROLLBACK_ARTIFACT_PERSISTED",
    );
  }

  console.log(
    "GM_G2M_4A_ROLLBACK_CONFIRMED_NO_ARTIFACT",
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
