import "server-only";

import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { hashInstrumentAccessToken } from "../access/accessToken";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

type InstrumentAccessResolutionClient = Pick<
  PrismaClient,
  "instrumentAccessGrant" | "domainEvent"
>;

export async function resolveInstrumentAccess(params: {
  publicId: string;
  token: string;
  recordAccess?: boolean;
}) {
  const token = params.token.trim();

  if (!token) {
    return null;
  }

  const settlement = await prisma.digitalSettlementInstruction.findUnique({
    where: { publicId: params.publicId },
    select: {
      instrumentId: true,
      instrument: {
        select: {
          currentVersion: true,
        },
      },
    },
  });

  if (!settlement) {
    return null;
  }

  const now = new Date();
  const grant = await prisma.instrumentAccessGrant.findUnique({
    where: { codeHash: hashInstrumentAccessToken(token) },
    select: {
      id: true,
      instrumentId: true,
      instrumentVersionId: true,
      accessLevel: true,
      recipientName: true,
      recipientRole: true,
      expiresAt: true,
      revokedAt: true,
      firstAccessAt: true,
    },
  });

  if (
    !grant ||
    grant.instrumentId !== settlement.instrumentId ||
    grant.revokedAt ||
    (grant.expiresAt && grant.expiresAt.getTime() <= now.getTime())
  ) {
    return null;
  }

  const currentVersion =
    await prisma.instrumentVersion.findUnique({
      where: {
        instrumentId_number: {
          instrumentId: settlement.instrumentId,
          number: settlement.instrument.currentVersion,
        },
      },
      select: {
        id: true,
        number: true,
        status: true,
      },
    });

  if (!currentVersion) {
    return null;
  }

  /*
   * Version access boundary:
   *
   * Legacy V1 grants predate version binding and may therefore have a null
   * instrumentVersionId. Preserve those credentials only while V1 remains
   * current.
   *
   * Once the instrument advances beyond V1, access must be explicitly bound
   * to the current version. A bearer credential for a superseded version
   * cannot silently follow the instrument forward.
   */
  const versionAccessValid =
    currentVersion.number === 1
      ? grant.instrumentVersionId === null ||
        grant.instrumentVersionId === currentVersion.id
      : grant.instrumentVersionId === currentVersion.id;

  if (!versionAccessValid) {
    return null;
  }

  if (params.recordAccess) {
    const recorded = await prisma.$transaction(
      async (tx: InstrumentAccessResolutionClient) => {
        const stillValid = {
          id: grant.id,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        } as const;

        if (!grant.firstAccessAt) {
          const firstAccess = await tx.instrumentAccessGrant.updateMany({
            where: { ...stillValid, firstAccessAt: null },
            data: { firstAccessAt: now, lastAccessAt: now },
          });

          if (firstAccess.count === 0) {
            const repeatedAccess = await tx.instrumentAccessGrant.updateMany({
              where: stillValid,
              data: { lastAccessAt: now },
            });

            if (repeatedAccess.count === 0) {
              return false;
            }
          }
        } else {
          const repeatedAccess = await tx.instrumentAccessGrant.updateMany({
            where: stillValid,
            data: { lastAccessAt: now },
          });

          if (repeatedAccess.count === 0) {
            return false;
          }
        }

        await tx.domainEvent.create({
          data: {
            streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
            streamId: settlement.instrumentId,
            eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_ACCESSED,
            payload: {
              accessGrantId: grant.id,
              publicId: params.publicId,
              accessedAt: now.toISOString(),
            },
            metadata: {
              accessGrantId: grant.id,
              source: "instrument.access-link.exchange",
            },
            occurredAt: now,
          },
        });

        return true;
      },
    );

    if (!recorded) {
      return null;
    }
  }

  return {
    accessGrantId: grant.id,
    accessLevel: grant.accessLevel,
    recipientName: grant.recipientName,
    recipientRole: grant.recipientRole,
    instrumentVersionNumber: currentVersion.number,
    expiresAt: grant.expiresAt,
  } as const;
}
