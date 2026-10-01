import type {
  PrismaClient,
} from "@prisma/client";

import {
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";

import {
  INSTRUMENT_EVENT_TYPE,
} from "../eventTypes";

export type CreateInstrumentDraftVersionClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "domainEvent"
  >;

type DraftVersionSourcePropositionRow = Readonly<{
  reference: string;
  domain: string;
  title: string;
  body: string;
  state:
    | "CONFIRMED"
    | "UNDERSTOOD"
    | "PROPOSED"
    | "OPEN"
    | "REVISED"
    | "DECLINED"
    | "SUPERSEDED";
  ordinal: number;
}>;

type DraftVersionSourceRow = Readonly<{
  id: string;
  number: number;
  status:
    | "DRAFT"
    | "ISSUED"
    | "SUPERSEDED"
    | "ARCHIVED";
  propositions:
    DraftVersionSourcePropositionRow[];
}>;

export async function createInstrumentDraftVersionWithClient(params: {
  client:
    CreateInstrumentDraftVersionClient;

  instrumentReference:
    string;

  createdByUserId:
    string;

  sourceVersionNumber?:
    number;

  correlationId:
    string;

  occurredAt?:
    Date;
}) {
  const occurredAt =
    params.occurredAt ??
    new Date();

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

          reference:
            true,

          currentVersion:
            true,

          versions: {
            orderBy: {
              number:
                "asc",
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
          },
        },
      });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_DRAFT_VERSION_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const existingDraft =
    instrument.versions.find(
      (
        version:
          DraftVersionSourceRow,
      ) =>
        version.status ===
        INSTRUMENT_VERSION_STATUS.DRAFT,
    );

  if (existingDraft) {
    throw new Error(
      `[INSTRUMENT_DRAFT_VERSION_ALREADY_EXISTS] ${instrument.reference} V${existingDraft.number}`,
    );
  }

  const sourceVersionNumber =
    params.sourceVersionNumber ??
    instrument.currentVersion;

  const sourceVersion =
    instrument.versions.find(
      (
        version:
          DraftVersionSourceRow,
      ) =>
        version.number ===
        sourceVersionNumber,
    );

  if (!sourceVersion) {
    throw new Error(
      `[INSTRUMENT_DRAFT_VERSION_SOURCE_NOT_FOUND] ${instrument.reference} V${sourceVersionNumber}`,
    );
  }

  if (
    sourceVersion.status !==
      INSTRUMENT_VERSION_STATUS.ISSUED &&
    sourceVersion.status !==
      INSTRUMENT_VERSION_STATUS.SUPERSEDED
  ) {
    throw new Error(
      `[INSTRUMENT_DRAFT_VERSION_SOURCE_NOT_STABLE] ${instrument.reference} V${sourceVersionNumber} ${sourceVersion.status}`,
    );
  }

  const maxVersionNumber =
    instrument.versions.reduce(
      (
        max: number,
        version:
          DraftVersionSourceRow,
      ) =>
        Math.max(
          max,
          version.number,
        ),
      0,
    );

  const nextVersionNumber =
    maxVersionNumber + 1;

  const draft =
    await params.client
      .instrumentVersion
      .create({
        data: {
          instrumentId:
            instrument.id,

          number:
            nextVersionNumber,

          status:
            INSTRUMENT_VERSION_STATUS.DRAFT,

          createdByUserId:
            params.createdByUserId,

          propositions: {
            create:
              sourceVersion
                .propositions
                .map(
                  (
                    proposition:
                      DraftVersionSourcePropositionRow,
                  ) => ({
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

        select: {
          id:
            true,

          number:
            true,

          status:
            true,

          createdByUserId:
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

  await params.client
    .domainEvent
    .create({
      data: {
        streamType:
          "INSTITUTIONAL_INSTRUMENT",

        streamId:
          instrument.id,

        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_VERSION_CREATED,

        payload: {
          versionId:
            draft.id,

          versionNumber:
            draft.number,

          status:
            draft.status,

          sourceVersionId:
            sourceVersion.id,

          sourceVersionNumber:
            sourceVersion.number,

          propositionCount:
            draft.propositions.length,
        },

        metadata: {
          actorUserId:
            params.createdByUserId,

          correlationId:
            params.correlationId,

          source:
            "instrument.version.create-draft",
        },

        occurredAt,
      },
    });

  return {
    instrument: {
      id:
        instrument.id,

      reference:
        instrument.reference,

      currentVersion:
        instrument.currentVersion,
    },

    sourceVersion: {
      id:
        sourceVersion.id,

      number:
        sourceVersion.number,

      status:
        sourceVersion.status,
    },

    draft,
  } as const;
}
