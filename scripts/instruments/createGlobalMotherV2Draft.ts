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
} from "../../src/domains/instruments/governance/runInstrumentGovernanceTransaction";

const prisma =
  new PrismaClient();

const REFERENCE =
  "GM-KENYA-RCF-001";

type ExistingVersionRow = Readonly<{
  number: number;
  status: string;
}>;

type CreatedDraftPropositionRow = Readonly<{
  reference: string;
  state: string;
  title: string;
}>;

async function main() {
  const instrument =
    await prisma.institutionalInstrument.findUnique({
      where: {
        reference:
          REFERENCE,
      },

      select: {
        id:
          true,

        createdByUserId:
          true,

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
          },
        },
      },
    });

  if (!instrument) {
    throw new Error(
      "GM_G2M_2B_INSTRUMENT_NOT_FOUND",
    );
  }

  if (
    instrument.currentVersion !==
      1
  ) {
    throw new Error(
      "GM_G2M_2B_CURRENT_VERSION_NOT_V1",
    );
  }

  if (
    instrument.versions.some(
      (
        version:
          ExistingVersionRow,
      ) =>
        version.status ===
        "DRAFT",
    )
  ) {
    throw new Error(
      "GM_G2M_2B_DRAFT_ALREADY_EXISTS",
    );
  }

  const result =
    await runInstrumentGovernanceTransaction(
      prisma,
      async tx => {
        return createInstrumentDraftVersionWithClient({
          client:
            tx,

          instrumentReference:
            REFERENCE,

          createdByUserId:
            instrument.createdByUserId,

          sourceVersionNumber:
            1,

          correlationId:
            randomUUID(),
        });
      },
      { timeoutMs: 60_000 },
    );

  console.log(
    JSON.stringify(
      {
        instrument:
          result.instrument,

        sourceVersion:
          result.sourceVersion,

        draft: {
          id:
            result.draft.id,

          number:
            result.draft.number,

          status:
            result.draft.status,

          propositionCount:
            result.draft
              .propositions
              .length,

          propositions:
            result.draft
              .propositions
              .map(
                (
                  proposition:
                    CreatedDraftPropositionRow,
                ) => ({
                  reference:
                    proposition.reference,

                  state:
                    proposition.state,

                  title:
                    proposition.title,
                }),
              ),
        },
      },
      null,
      2,
    ),
  );

  if (
    result.instrument.currentVersion !==
      1 ||
    result.sourceVersion.number !==
      1 ||
    result.sourceVersion.status !==
      "ISSUED" ||
    result.draft.number !==
      2 ||
    result.draft.status !==
      "DRAFT" ||
    result.draft.propositions.length !==
      8
  ) {
    throw new Error(
      "GM_G2M_2B_DRAFT_CREATION_RESULT_INVALID",
    );
  }

  console.log(
    "GM_G2M_2B_REAL_V2_DRAFT_CREATED",
  );

  console.log(
    "GM_G2M_2B_V1_REMAINS_OPERATIVE",
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
