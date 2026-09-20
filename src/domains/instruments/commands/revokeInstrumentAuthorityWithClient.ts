import type { PrismaClient } from "@prisma/client";

import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentAuthorityRevocationClient = Pick<
  PrismaClient,
  "instrumentAuthority" | "domainEvent"
>;

export async function revokeInstrumentAuthorityWithClient(params: {
  client: InstrumentAuthorityRevocationClient;
  authorityId: string;
  revokedByUserId: string;
  revokedAt?: Date;
}) {
  const authority =
    await params.client.instrumentAuthority.findUnique({
      where: {
        id: params.authorityId,
      },
      select: {
        id: true,
        instrumentId: true,
        authorityKey: true,
        holderPartyId: true,
        authorityClass: true,
        revokedAt: true,
      },
    });

  if (!authority) {
    throw new Error(
      `[INSTRUMENT_AUTHORITY_NOT_FOUND] ${params.authorityId}`,
    );
  }

  if (authority.revokedAt) {
    return {
      revoked: false,
      revokedAt: authority.revokedAt,
    } as const;
  }

  const revokedAt =
    params.revokedAt ?? new Date();

  const updated =
    await params.client.instrumentAuthority.updateMany({
      where: {
        id: authority.id,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });

  if (updated.count !== 1) {
    throw new Error(
      "[INSTRUMENT_AUTHORITY_CONCURRENT_REVOCATION]",
    );
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: authority.instrumentId,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_AUTHORITY_REVOKED,
      payload: {
        authorityId: authority.id,
        authorityKey:
          authority.authorityKey,
        authorityClass:
          authority.authorityClass,
        holderPartyId:
          authority.holderPartyId,
        revokedAt:
          revokedAt.toISOString(),
      },
      metadata: {
        actorUserId:
          params.revokedByUserId,
        source:
          "instrument.command.revoke-authority",
      },
      occurredAt: revokedAt,
    },
  });

  return {
    revoked: true,
    revokedAt,
  } as const;
}
