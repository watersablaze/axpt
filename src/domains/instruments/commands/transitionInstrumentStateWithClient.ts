import type { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_AUTHORITY_CLASS,
  isInstrumentAuthorityActive,
  type InstitutionalInstrumentStatus,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentStateTransitionClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentAuthority"
  | "instrumentStateTransition"
  | "domainEvent"
>;

export async function transitionInstrumentStateWithClient(params: {
  client: InstrumentStateTransitionClient;
  instrumentReference: string;
  expectedFromStatus: InstitutionalInstrumentStatus;
  toStatus: InstitutionalInstrumentStatus;
  actorUserId: string;
  authorityId?: string | null;
  reason?: string | null;
  metadata?: unknown;
  occurredAt?: Date;
}) {
  const occurredAt = params.occurredAt ?? new Date();

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference: params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
        status: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_TRANSITION_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  /*
   * Idempotent convergence:
   * if the instrument has already reached the requested target,
   * do not append another transition or event.
   */
  if (instrument.status === params.toStatus) {
    return {
      instrumentId: instrument.id,
      fromStatus: instrument.status,
      toStatus: instrument.status,
      transitionId: null,
      transitioned: false,
    } as const;
  }

  if (instrument.status !== params.expectedFromStatus) {
    throw new Error(
      `[INSTRUMENT_TRANSITION_STATE_MISMATCH] expected=${params.expectedFromStatus} actual=${instrument.status}`,
    );
  }

  let authority:
    | {
        id: string;
        instrumentId: string;
        authorityKey: string;
        authorityClass: string;
        holderPartyId: string | null;
        action: string;
        effectiveAt: Date;
        expiresAt: Date | null;
        revokedAt: Date | null;
      }
    | null = null;

  if (params.authorityId) {
    authority =
      await params.client.instrumentAuthority.findUnique({
        where: {
          id: params.authorityId,
        },
        select: {
          id: true,
          instrumentId: true,
          authorityKey: true,
          authorityClass: true,
          holderPartyId: true,
          action: true,
          effectiveAt: true,
          expiresAt: true,
          revokedAt: true,
        },
      });

    if (!authority) {
      throw new Error(
        `[INSTRUMENT_TRANSITION_AUTHORITY_NOT_FOUND] ${params.authorityId}`,
      );
    }

    if (authority.instrumentId !== instrument.id) {
      throw new Error(
        "[INSTRUMENT_TRANSITION_AUTHORITY_INSTRUMENT_MISMATCH]",
      );
    }

    if (
      authority.authorityClass ===
      INSTRUMENT_AUTHORITY_CLASS.PROHIBITED
    ) {
      throw new Error(
        "[INSTRUMENT_TRANSITION_PROHIBITED_AUTHORITY]",
      );
    }

    if (
      !isInstrumentAuthorityActive(
        authority,
        occurredAt,
      )
    ) {
      throw new Error(
        "[INSTRUMENT_TRANSITION_AUTHORITY_INACTIVE]",
      );
    }
  }

  /*
   * Optimistic compare-and-set.
   *
   * This prevents a stale command from silently replacing a
   * status that changed after the initial read.
   */
  const updated =
    await params.client.institutionalInstrument.updateMany({
      where: {
        id: instrument.id,
        status: params.expectedFromStatus,
      },
      data: {
        status: params.toStatus,
      },
    });

  if (updated.count !== 1) {
    throw new Error(
      "[INSTRUMENT_TRANSITION_CONCURRENT_STATE_CHANGE]",
    );
  }

  const transition =
    await params.client.instrumentStateTransition.create({
      data: {
        instrumentId: instrument.id,
        fromStatus: params.expectedFromStatus,
        toStatus: params.toStatus,
        actorUserId: params.actorUserId,
        authorityId: authority?.id ?? null,
        reason: params.reason ?? null,
        metadata:
          params.metadata === undefined
            ? undefined
            : (params.metadata as object),
        occurredAt,
      },
      select: {
        id: true,
        instrumentId: true,
        fromStatus: true,
        toStatus: true,
        actorUserId: true,
        authorityId: true,
        reason: true,
        metadata: true,
        occurredAt: true,
      },
    });

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_STATE_TRANSITION_RECORDED,
        payload: {
          transitionId: transition.id,
          fromStatus: transition.fromStatus,
          toStatus: transition.toStatus,
          authorityId:
            transition.authorityId,
          reason: transition.reason,
          occurredAt:
            transition.occurredAt.toISOString(),
        },
        metadata: {
          actorUserId: params.actorUserId,
          authorityId:
            transition.authorityId,
          source:
            "instrument.command.transition-state",
        },
        occurredAt,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_STATUS_CHANGED,
        payload: {
          from: params.expectedFromStatus,
          to: params.toStatus,
          transitionId: transition.id,
        },
        metadata: {
          actorUserId: params.actorUserId,
          authorityId:
            transition.authorityId,
          source:
            "instrument.command.transition-state",
        },
        occurredAt,
      },
    ],
  });

  return {
    instrumentId: instrument.id,
    fromStatus: params.expectedFromStatus,
    toStatus: params.toStatus,
    transitionId: transition.id,
    transitioned: true,
  } as const;
}
