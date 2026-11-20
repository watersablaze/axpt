import type { PrismaClient } from "@prisma/client";

import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentAccessGrantRevocationClient = Pick<
  PrismaClient,
  "instrumentAccessGrant" | "domainEvent"
>;

export async function revokeInstrumentAccessGrantWithClient(params: {
  client: InstrumentAccessGrantRevocationClient;
  accessGrantId: string;
  revokedByUserId: string;
  revokedAt?: Date;
}) {
  const grant = await params.client.instrumentAccessGrant.findUnique({
    where: { id: params.accessGrantId },
    select: { id: true, instrumentId: true, revokedAt: true },
  });

  if (!grant) {
    throw new Error(
      `[INSTRUMENT_ACCESS_GRANT_NOT_FOUND] ${params.accessGrantId}`,
    );
  }

  if (grant.revokedAt) {
    return { revoked: false, revokedAt: grant.revokedAt } as const;
  }

  const revokedAt = params.revokedAt ?? new Date();
  const updated = await params.client.instrumentAccessGrant.updateMany({
    where: { id: grant.id, revokedAt: null },
    data: { revokedAt },
  });

  if (updated.count !== 1) {
    throw new Error("[INSTRUMENT_ACCESS_GRANT_CONCURRENT_REVOCATION]");
  }

  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: grant.instrumentId,
      eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_ACCESS_REVOKED,
      payload: { accessGrantId: grant.id, revokedAt: revokedAt.toISOString() },
      metadata: {
        actorUserId: params.revokedByUserId,
        source: "instrument.command.revoke-access-grant",
      },
      occurredAt: revokedAt,
    },
  });

  return { revoked: true, revokedAt } as const;
}
