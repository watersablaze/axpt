import type {
  PrismaClient,
} from "@prisma/client";

import {
  INSTRUMENT_VERSION_STATUS,
  type InstrumentPropositionState,
} from "../contracts";

export type ReplaceInstrumentDraftPropositionsClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "instrumentProposition"
  >;

export type DraftPropositionInput = Readonly<{
  reference: string;
  domain: string;
  title: string;
  body: string;
  state: InstrumentPropositionState;
  ordinal: number;
}>;

export async function replaceInstrumentDraftPropositionsWithClient(
  params: {
    client:
      ReplaceInstrumentDraftPropositionsClient;

    instrumentReference:
      string;

    versionNumber:
      number;

    propositions:
      readonly DraftPropositionInput[];
  },
) {
  if (
    params.propositions.length ===
      0
  ) {
    throw new Error(
      "INSTRUMENT_DRAFT_PROPOSITIONS_EMPTY",
    );
  }

  const referenceSet =
    new Set(
      params.propositions.map(
        proposition =>
          proposition.reference,
      ),
    );

  if (
    referenceSet.size !==
      params.propositions.length
  ) {
    throw new Error(
      "INSTRUMENT_DRAFT_PROPOSITION_REFERENCE_DUPLICATE",
    );
  }

  const ordinalSet =
    new Set(
      params.propositions.map(
        proposition =>
          proposition.ordinal,
      ),
    );

  if (
    ordinalSet.size !==
      params.propositions.length
  ) {
    throw new Error(
      "INSTRUMENT_DRAFT_PROPOSITION_ORDINAL_DUPLICATE",
    );
  }

  const expectedOrdinals =
    Array.from(
      {
        length:
          params.propositions.length,
      },
      (_, index) =>
        index + 1,
    );

  const actualOrdinals =
    [...ordinalSet].sort(
      (a, b) =>
        a - b,
    );

  if (
    JSON.stringify(
      actualOrdinals,
    ) !==
    JSON.stringify(
      expectedOrdinals,
    )
  ) {
    throw new Error(
      "INSTRUMENT_DRAFT_PROPOSITION_ORDINAL_SEQUENCE_INVALID",
    );
  }

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            params.instrumentReference,
        },

        select: {
          id:
            true,

          currentVersion:
            true,

          versions: {
            where: {
              number:
                params.versionNumber,
            },

            select: {
              id:
                true,

              number:
                true,

              status:
                true,

              propositions: {
                select: {
                  id:
                    true,

                  responses: {
                    select: {
                      id:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_DRAFT_REPLACEMENT_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const version =
    instrument.versions[0];

  if (!version) {
    throw new Error(
      `[INSTRUMENT_DRAFT_REPLACEMENT_VERSION_NOT_FOUND] ${params.instrumentReference} V${params.versionNumber}`,
    );
  }

  if (
    version.status !==
      INSTRUMENT_VERSION_STATUS.DRAFT
  ) {
    throw new Error(
      `[INSTRUMENT_DRAFT_REPLACEMENT_VERSION_NOT_DRAFT] ${params.instrumentReference} V${params.versionNumber}`,
    );
  }

  if (
    version.number <=
      instrument.currentVersion
  ) {
    throw new Error(
      `[INSTRUMENT_DRAFT_REPLACEMENT_VERSION_NOT_FUTURE] ${params.instrumentReference} current=V${instrument.currentVersion} target=V${version.number}`,
    );
  }

  const responseCount =
    version.propositions.reduce(
      (
        total:
          number,
        proposition:
          {
            responses:
              readonly {
                id:
                  string;
              }[];
          },
      ) =>
        total +
        proposition.responses.length,
      0,
    );

  if (
    responseCount !==
      0
  ) {
    throw new Error(
      `[INSTRUMENT_DRAFT_REPLACEMENT_RESPONSES_PRESENT] ${params.instrumentReference} V${params.versionNumber}`,
    );
  }

  await params.client
    .instrumentProposition
    .deleteMany({
      where: {
        versionId:
          version.id,
      },
    });

  await params.client
    .instrumentVersion
    .update({
      where: {
        id:
          version.id,
      },

      data: {
        propositions: {
          create:
            params.propositions.map(
              proposition => ({
                reference:
                  proposition.reference,

                domain:
                  proposition.domain,

                title:
                  proposition.title,

                body:
                  proposition.body,

                state:
                  proposition.state,

                ordinal:
                  proposition.ordinal,
              }),
            ),
        },
      },
    });

  const revised =
    await params.client
      .instrumentVersion
      .findUnique({
        where: {
          id:
            version.id,
        },

        select: {
          id:
            true,

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
              id:
                true,

              reference:
                true,

              domain:
                true,

              title:
                true,

              body:
                true,

              state:
                true,

              ordinal:
                true,
            },
          },
        },
      });

  if (!revised) {
    throw new Error(
      "INSTRUMENT_DRAFT_REPLACEMENT_RESULT_MISSING",
    );
  }

  return {
    instrumentId:
      instrument.id,

    currentVersion:
      instrument.currentVersion,

    version:
      revised,
  } as const;
}
