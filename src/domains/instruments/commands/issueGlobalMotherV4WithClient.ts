import type {
  PrismaClient,
} from "@prisma/client";

import {
  globalMotherV4Definition,
} from "../definitions/globalMotherV4Definition";

import {
  INSTRUMENT_EVENT_TYPE,
} from "../eventTypes";

import {
  INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
} from "../stream";

export type GlobalMotherV4IssuanceClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "domainEvent"
  >;

type GlobalMotherV4IssuancePropositionRow =
  Readonly<{
    reference: string;
    body: string;
    responses: readonly {
      id: string;
    }[];
  }>;

export async function issueGlobalMotherV4WithClient(
  params: {
    client:
      GlobalMotherV4IssuanceClient;

    actorUserId:
      string;

    expectedVersionId:
      string;
  },
) {
  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            globalMotherV4Definition
              .reference,
        },

        select: {
          id:
            true,

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

              issuedAt:
                true,

              propositions: {
                orderBy: {
                  ordinal:
                    "asc",
                },

                select: {
                  reference:
                    true,

                  body:
                    true,

                  responses: {
                    select: {
                      id:
                        true,
                    },

                    take:
                      1,
                  },
                },
              },
            },
          },
        },
      });

  const version =
    instrument?.versions[0];

  const expectedFingerprint =
    JSON.stringify(
      globalMotherV4Definition
        .propositions
        .map(
          proposition => [
            proposition.reference,
            proposition.body,
          ],
        ),
    );

  const actualFingerprint =
    version
      ? JSON.stringify(
          version.propositions.map(
            (
              proposition:
                GlobalMotherV4IssuancePropositionRow,
            ) => [
              proposition.reference,
              proposition.body,
            ],
          ),
        )
      : null;

  if (
    !instrument ||
    !version ||
    version.id !==
      params.expectedVersionId ||
    instrument.currentVersion !== 3 ||
    instrument.status !==
      "UNDER_DELIBERATION" ||
    version.status !==
      "DRAFT" ||
    version.issuedAt !==
      null ||
    version.propositions.length !==
      globalMotherV4Definition
        .propositions.length ||
    version.propositions.some(
      (
        proposition:
          GlobalMotherV4IssuancePropositionRow,
      ) =>
        proposition.responses.length !==
        0,
    ) ||
    actualFingerprint !==
      expectedFingerprint
  ) {
    throw new Error(
      "[GM_V4_ISSUANCE_PRECONDITION_FAILED]",
    );
  }

  const issuedAt =
    new Date();

  const instrumentUpdated =
    await params.client
      .institutionalInstrument
      .updateMany({
        where: {
          id:
            instrument.id,

          currentVersion:
            3,

          status:
            "UNDER_DELIBERATION",
        },

        data: {
          currentVersion:
            globalMotherV4Definition
              .version,
        },
      });

  if (
    instrumentUpdated.count !==
    1
  ) {
    throw new Error(
      "[GM_V4_ISSUANCE_CONCURRENT_INSTRUMENT_CHANGE]",
    );
  }

  const versionUpdated =
    await params.client
      .instrumentVersion
      .updateMany({
        where: {
          id:
            version.id,

          status:
            "DRAFT",

          issuedAt:
            null,
        },

        data: {
          status:
            "ISSUED",

          issuedAt,
        },
      });

  if (
    versionUpdated.count !==
    1
  ) {
    throw new Error(
      "[GM_V4_ISSUANCE_CONCURRENT_VERSION_CHANGE]",
    );
  }

  await params.client
    .domainEvent
    .create({
      data: {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,

        streamId:
          instrument.id,

        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_VERSION_ISSUED,

        payload: {
          versionId:
            version.id,

          versionNumber:
            globalMotherV4Definition
              .version,

          issuedAt:
            issuedAt.toISOString(),

          priorVersion:
            3,

          formationDoctrine:
            "MASTER_AGREEMENT_AND_PROCLAMATION_OF_TRUST",
        },

        metadata: {
          actorUserId:
            params.actorUserId,

          source:
            "gm-v4.operator.issue",
        },

        occurredAt:
          issuedAt,
      },
    });

  return {
    versionId:
      version.id,

    issuedAt,
  } as const;
}
