import type { PrismaClient } from "@prisma/client";

import {
  canRespondAtAccessLevel,
  type InstrumentCommandContext,
  type InstrumentResponseType,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentResponseRecordingClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentProposition"
  | "instrumentAccessGrant"
  | "instrumentResponse"
  | "domainEvent"
>;

export async function recordInstrumentResponseWithClient(params: {
  client: InstrumentResponseRecordingClient;
  instrumentReference: string;
  propositionReference: string;
  responseType: InstrumentResponseType;
  note?: string | null;
  context: InstrumentCommandContext;
}) {
  const propositionReference =
    params.propositionReference.trim();

  const note =
    params.note?.trim() || null;

  if (!propositionReference) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_PROPOSITION_REFERENCE_REQUIRED]",
    );
  }

  const accessGrantId =
    params.context.accessGrantId;

  if (!accessGrantId) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_GRANT_REQUIRED]",
    );
  }

  const occurredAt =
    params.context.occurredAt ??
    new Date();

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference:
          params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
        currentVersion: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_RESPONSE_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const proposition =
    await params.client.instrumentProposition.findFirst({
      where: {
        reference:
          propositionReference,
        version: {
          instrumentId:
            instrument.id,
          number:
            instrument.currentVersion,
        },
      },
      select: {
        id: true,
        reference: true,
        state: true,
        versionId: true,
      },
    });

  if (!proposition) {
    throw new Error(
      `[INSTRUMENT_RESPONSE_PROPOSITION_NOT_FOUND] ${propositionReference}`,
    );
  }

  const grant =
    await params.client.instrumentAccessGrant.findUnique({
      where: {
        id: accessGrantId,
      },
      select: {
        id: true,
        instrumentId: true,
        recipientUserId: true,
        accessLevel: true,
        instrumentVersionId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

  if (!grant) {
    throw new Error(
      `[INSTRUMENT_RESPONSE_ACCESS_GRANT_NOT_FOUND] ${accessGrantId}`,
    );
  }

  if (
    grant.instrumentId !==
    instrument.id
  ) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_GRANT_INSTRUMENT_MISMATCH]",
    );
  }

  /* V2 responses require a grant bound to the exact issued version. */
  if (instrument.reference === "GM-KENYA-RCF-001" &&
      instrument.currentVersion >= 2 &&
      grant.instrumentVersionId !== proposition.versionId) {
    throw new Error("[INSTRUMENT_RESPONSE_VERSION_GRANT_MISMATCH]");
  }

  if (grant.revokedAt) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_GRANT_REVOKED]",
    );
  }

  if (
    grant.expiresAt &&
    grant.expiresAt.getTime() <=
      occurredAt.getTime()
  ) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_GRANT_EXPIRED]",
    );
  }

  if (
    !canRespondAtAccessLevel(
      grant.accessLevel,
    )
  ) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_LEVEL_INSUFFICIENT]",
    );
  }

  if (!grant.recipientUserId) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_IDENTITY_REQUIRED]",
    );
  }

  if (
    grant.recipientUserId !==
    params.context.actorUserId
  ) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACTOR_ACCESS_MISMATCH]",
    );
  }

  const previous =
    await params.client.instrumentResponse.findFirst({
      where: {
        propositionId:
          proposition.id,
        actorUserId:
          params.context.actorUserId,
        supersededAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        propositionId: true,
        actorUserId: true,
        responseType: true,
        note: true,
        createdAt: true,
        supersededAt: true,
      },
    });

  /*
   * A response is append-only institutional history.
   *
   * A later response does not update or delete the prior
   * position. The prior position is marked superseded and
   * the new response points back to it.
   */
  if (previous) {
    const superseded =
      await params.client.instrumentResponse.updateMany({
        where: {
          id: previous.id,
          supersededAt: null,
        },
        data: {
          supersededAt:
            occurredAt,
        },
      });

    if (superseded.count !== 1) {
      throw new Error(
        "[INSTRUMENT_RESPONSE_SUPERSESSION_CONFLICT]",
      );
    }
  }

  const response =
    await params.client.instrumentResponse.create({
      data: {
        propositionId:
          proposition.id,
        actorUserId:
          params.context.actorUserId,
        responseType:
          params.responseType,
        note,
        supersedesResponseId:
          previous?.id ?? null,
      },
      select: {
        id: true,
        propositionId: true,
        actorUserId: true,
        responseType: true,
        note: true,
        supersedesResponseId: true,
        supersededAt: true,
        createdAt: true,
      },
    });

  if (previous) {
    await params.client.domainEvent.create({
      data: {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId:
          instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_RESPONSE_SUPERSEDED,
        payload: {
          propositionId:
            proposition.id,
          propositionReference:
            proposition.reference,
          supersededResponseId:
            previous.id,
          supersedingResponseId:
            response.id,
          actorUserId:
            params.context.actorUserId,
          supersededAt:
            occurredAt.toISOString(),
        },
        metadata: {
          actorUserId:
            params.context.actorUserId,
          accessGrantId,
          correlationId:
            params.context.correlationId,
          causationId:
            params.context.causationId ??
            null,
          source:
            "instrument.command.record-response",
        },
        occurredAt,
      },
    });
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_RESPONSE_RECORDED,
      payload: {
        responseId:
          response.id,
        propositionId:
          proposition.id,
        propositionReference:
          proposition.reference,
        responseType:
          response.responseType,
        actorUserId:
          response.actorUserId,
        supersedesResponseId:
          response.supersedesResponseId,
      },
      metadata: {
        actorUserId:
          params.context.actorUserId,
        accessGrantId,
        correlationId:
          params.context.correlationId,
        causationId:
          params.context.causationId ??
          null,
        source:
          "instrument.command.record-response",
      },
      occurredAt,
    },
  });

  return {
    response,
    supersededResponse:
      previous ?? null,
  } as const;
}
