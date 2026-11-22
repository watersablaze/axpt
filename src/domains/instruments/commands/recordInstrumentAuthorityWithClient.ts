import type { PrismaClient } from "@prisma/client";

import {
  isInstrumentAuthorityActive,
  type InstrumentAuthorityClass,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentAuthorityRecordingClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentParty"
  | "instrumentAuthority"
  | "domainEvent"
>;

export async function recordInstrumentAuthorityWithClient(params: {
  client: InstrumentAuthorityRecordingClient;
  instrumentReference: string;
  authorityKey: string;
  title: string;
  authorityClass: InstrumentAuthorityClass;
  holderPartyId?: string | null;
  action: string;
  conditions?: unknown;
  effectiveAt?: Date;
  expiresAt?: Date | null;
  actorUserId: string;
}) {
  const authorityKey = params.authorityKey.trim();
  const title = params.title.trim();
  const action = params.action.trim();

  if (!authorityKey) {
    throw new Error("[INSTRUMENT_AUTHORITY_KEY_REQUIRED]");
  }

  if (!title) {
    throw new Error("[INSTRUMENT_AUTHORITY_TITLE_REQUIRED]");
  }

  if (!action) {
    throw new Error("[INSTRUMENT_AUTHORITY_ACTION_REQUIRED]");
  }

  const effectiveAt = params.effectiveAt ?? new Date();
  const expiresAt = params.expiresAt ?? null;

  if (
    expiresAt &&
    expiresAt.getTime() <= effectiveAt.getTime()
  ) {
    throw new Error(
      "[INSTRUMENT_AUTHORITY_EXPIRY_MUST_FOLLOW_EFFECTIVE_AT]",
    );
  }

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference: params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_AUTHORITY_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const holderPartyId =
    params.holderPartyId ?? null;

  if (holderPartyId) {
    const holder =
      await params.client.instrumentParty.findUnique({
        where: {
          id: holderPartyId,
        },
        select: {
          id: true,
          instrumentId: true,
        },
      });

    if (!holder) {
      throw new Error(
        `[INSTRUMENT_AUTHORITY_HOLDER_NOT_FOUND] ${holderPartyId}`,
      );
    }

    if (holder.instrumentId !== instrument.id) {
      throw new Error(
        "[INSTRUMENT_AUTHORITY_HOLDER_INSTRUMENT_MISMATCH]",
      );
    }
  }

  const candidates =
    await params.client.instrumentAuthority.findMany({
      where: {
        instrumentId: instrument.id,
        authorityKey,
        authorityClass: params.authorityClass,
        holderPartyId,
        action,
        revokedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        instrumentId: true,
        authorityKey: true,
        title: true,
        authorityClass: true,
        holderPartyId: true,
        action: true,
        conditions: true,
        effectiveAt: true,
        expiresAt: true,
        revokedAt: true,
        createdByUserId: true,
      },
    });

  const existing = candidates.find(
    (candidate: {
      id: string;
      instrumentId: string;
      authorityKey: string;
      title: string;
      authorityClass: string;
      holderPartyId: string | null;
      action: string;
      conditions: unknown;
      effectiveAt: Date;
      expiresAt: Date | null;
      revokedAt: Date | null;
      createdByUserId: string;
    }) =>
      isInstrumentAuthorityActive(
        candidate,
        effectiveAt,
      ),
  );

  if (existing) {
    return {
      authority: existing,
      created: false,
    } as const;
  }

  const authority =
    await params.client.instrumentAuthority.create({
      data: {
        instrumentId: instrument.id,
        authorityKey,
        title,
        authorityClass: params.authorityClass,
        holderPartyId,
        action,
        conditions:
          params.conditions === undefined
            ? undefined
            : (params.conditions as object),
        effectiveAt,
        expiresAt,
        createdByUserId: params.actorUserId,
      },
      select: {
        id: true,
        instrumentId: true,
        authorityKey: true,
        title: true,
        authorityClass: true,
        holderPartyId: true,
        action: true,
        conditions: true,
        effectiveAt: true,
        expiresAt: true,
        revokedAt: true,
        createdByUserId: true,
      },
    });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_AUTHORITY_RECORDED,
      payload: {
        authorityId: authority.id,
        authorityKey: authority.authorityKey,
        title: authority.title,
        authorityClass:
          authority.authorityClass,
        holderPartyId:
          authority.holderPartyId,
        action: authority.action,
        effectiveAt:
          authority.effectiveAt.toISOString(),
        expiresAt:
          authority.expiresAt?.toISOString() ??
          null,
      },
      metadata: {
        actorUserId: params.actorUserId,
        source:
          "instrument.command.record-authority",
      },
      occurredAt: effectiveAt,
    },
  });

  return {
    authority,
    created: true,
  } as const;
}
