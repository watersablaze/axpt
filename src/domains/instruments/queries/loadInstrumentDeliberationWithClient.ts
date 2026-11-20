import type { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_RESOLUTION_STATE,
  type InstrumentPropositionState,
  type InstrumentResolutionState,
  type InstrumentResponseType,
} from "../contracts";
import {
  deriveInstrumentPropositionResolution,
} from "../invariants/deriveInstrumentPropositionResolution";

export type InstrumentDeliberationReadClient = Pick<
  PrismaClient,
  "institutionalInstrument"
>;

type InstrumentDeliberationResponseRow = Readonly<{
  id: string;
  actorUserId: string;
  responseType: InstrumentResponseType;
  note: string | null;
  createdAt: Date;
}>;

type InstrumentDeliberationPropositionRow = Readonly<{
  id: string;
  reference: string;
  domain: string;
  title: string;
  body: string;
  state: InstrumentPropositionState;
  ordinal: number;
  responses: InstrumentDeliberationResponseRow[];
}>;

type InstrumentDeliberationVersionRow = Readonly<{
  id: string;
  number: number;
  status: string;
  propositions: InstrumentDeliberationPropositionRow[];
}>;

export type InstrumentDeliberationItem = Readonly<{
  id: string;
  reference: string;
  domain: string;
  title: string;
  body: string;
  state: string;
  ordinal: number;

  response: Readonly<{
    id: string;
    actorUserId: string;
    responseType: InstrumentResponseType;
    note: string | null;
    createdAt: Date;
  }> | null;

  resolution: InstrumentResolutionState;
}>;

export async function loadInstrumentDeliberationWithClient(params: {
  client: InstrumentDeliberationReadClient;
  instrumentReference: string;
  actorUserId?: string | null;

  /*
   * Optional presentation-only version selection.
   *
   * Omitted:
   *   project the instrument's operative currentVersion.
   *
   * Supplied:
   *   project that explicit version without mutating
   *   currentVersion, issuance, authority, or standing.
   */
  versionNumber?: number | null;
}) {
  /*
   * Deliberation resolution is actor-specific.
   *
   * A projection without a bound actor must not borrow
   * an administrative identity merely to satisfy the query.
   * The sentinel below is query-local only and cannot match
   * a real AXPT user id.
   */
  const responseActorUserId =
    params.actorUserId?.trim() ||
    "__NO_BOUND_DELIBERATION_ACTOR__";

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference:
          params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
        kind: true,
        title: true,
        status: true,
        currentVersion: true,

        versions: {
          orderBy: {
            number: "asc",
          },
          select: {
            id: true,
            number: true,
            status: true,

            propositions: {
              orderBy: {
                ordinal: "asc",
              },
              select: {
                id: true,
                reference: true,
                domain: true,
                title: true,
                body: true,
                state: true,
                ordinal: true,

                responses: {
                  where: {
                    actorUserId:
                      responseActorUserId,
                    supersededAt: null,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 1,
                  select: {
                    id: true,
                    actorUserId: true,
                    responseType: true,
                    note: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!instrument) {
    return null;
  }

  const selectedVersionNumber =
    params.versionNumber ??
    instrument.currentVersion;

  const selectedVersion =
    instrument.versions.find(
      (
        version:
          InstrumentDeliberationVersionRow,
      ) =>
        version.number ===
        selectedVersionNumber,
    );

  if (!selectedVersion) {
    throw new Error(
      `[INSTRUMENT_DELIBERATION_VERSION_NOT_FOUND] ${instrument.reference} V${selectedVersionNumber}`,
    );
  }

  const propositions: InstrumentDeliberationItem[] =
    selectedVersion.propositions.map(
      (
        proposition:
          InstrumentDeliberationPropositionRow,
      ) => {
        const response =
          proposition.responses[0] ??
          null;

        const resolution =
          deriveInstrumentPropositionResolution({
            propositionState:
              proposition.state,
            responseType:
              response?.responseType ??
              null,
          });

        return {
          id:
            proposition.id,
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

          response:
            response
              ? {
                  id:
                    response.id,
                  actorUserId:
                    response.actorUserId,
                  responseType:
                    response.responseType,
                  note:
                    response.note,
                  createdAt:
                    response.createdAt,
                }
              : null,

          resolution,
        };
      },
    );

  const summary = {
    total:
      propositions.length,

    responded:
      propositions.filter(
        (item) =>
          item.response !== null,
      ).length,

    unresponded:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .UNRESPONDED,
      ).length,

    aligned:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .ALIGNED,
      ).length,

    received:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .RECEIVED,
      ).length,

    clarificationOpen:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .CLARIFICATION_OPEN,
      ).length,

    revisionPending:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .REVISION_PENDING,
      ).length,

    notAligned:
      propositions.filter(
        (item) =>
          item.resolution ===
          INSTRUMENT_RESOLUTION_STATE
            .NOT_ALIGNED,
      ).length,
  } as const;

  return {
    instrument: {
      id:
        instrument.id,
      reference:
        instrument.reference,
      kind:
        instrument.kind,
      title:
        instrument.title,
      status:
        instrument.status,
      currentVersion:
        instrument.currentVersion,
    },

    version: {
      id:
        selectedVersion.id,
      number:
        selectedVersion.number,
      status:
        selectedVersion.status,
    },

    actorUserId:
      params.actorUserId ?? null,

    propositions,
    summary,
  } as const;
}
