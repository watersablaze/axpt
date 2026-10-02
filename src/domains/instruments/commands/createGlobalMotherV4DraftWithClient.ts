import type {
  PrismaClient,
} from "@prisma/client";

import {
  globalMotherV4Definition,
} from "../definitions/globalMotherV4Definition";

import {
  createInstrumentDraftVersionWithClient,
} from "./createInstrumentDraftVersionWithClient";

import {
  replaceInstrumentDraftPropositionsWithClient,
} from "./replaceInstrumentDraftPropositionsWithClient";

export type GlobalMotherV4DraftClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "instrumentProposition"
    | "domainEvent"
  >;

type GlobalMotherV4ExistingVersionRow =
  Readonly<{
    id: string;
    number: number;
    status:
      | "DRAFT"
      | "ISSUED"
      | "SUPERSEDED"
      | "ARCHIVED";
  }>;

type GlobalMotherV4DraftPropositionRow =
  Readonly<{
    reference: string;
    body: string;
  }>;

export async function createGlobalMotherV4DraftWithClient(
  params: {
    client:
      GlobalMotherV4DraftClient;

    actorUserId:
      string;

    correlationId:
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
            },
          },
        },
      });

  if (
    !instrument ||
    instrument.currentVersion !== 3 ||
    instrument.status !==
      "UNDER_DELIBERATION"
  ) {
    throw new Error(
      "[GM_V4_DRAFT_PRECONDITION_FAILED]",
    );
  }

  const existingV4 =
    instrument.versions.find(
      (
        version:
          GlobalMotherV4ExistingVersionRow,
      ) =>
        version.number ===
        globalMotherV4Definition.version,
    );

  if (existingV4) {
    throw new Error(
      "[GM_V4_DRAFT_ALREADY_EXISTS]",
    );
  }

  const created =
    await createInstrumentDraftVersionWithClient({
      client:
        params.client,

      instrumentReference:
        globalMotherV4Definition
          .reference,

      createdByUserId:
        params.actorUserId,

      sourceVersionNumber:
        3,

      correlationId:
        params.correlationId,
    });

  if (
    created.draft.number !==
    globalMotherV4Definition.version
  ) {
    throw new Error(
      "[GM_V4_DRAFT_VERSION_NUMBER_MISMATCH]",
    );
  }

  const replaced =
    await replaceInstrumentDraftPropositionsWithClient({
      client:
        params.client,

      instrumentReference:
        globalMotherV4Definition
          .reference,

      versionNumber:
        globalMotherV4Definition
          .version,

      propositions:
        globalMotherV4Definition
          .propositions,
    });

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
    JSON.stringify(
      replaced.version
        .propositions
        .map(
          (
            proposition:
              GlobalMotherV4DraftPropositionRow,
          ) => [
            proposition.reference,
            proposition.body,
          ],
        ),
    );

  if (
    replaced.version.number !==
      globalMotherV4Definition.version ||
    replaced.version.status !==
      "DRAFT" ||
    actualFingerprint !==
      expectedFingerprint
  ) {
    throw new Error(
      "[GM_V4_DRAFT_POSTCONDITION_FAILED]",
    );
  }

  return {
    instrumentId:
      instrument.id,

    versionId:
      replaced.version.id,

    versionNumber:
      replaced.version.number,

    status:
      replaced.version.status,

    propositionCount:
      replaced.version
        .propositions.length,
  } as const;
}
