import type { PrismaClient } from "@prisma/client";

import {
  hashInstrumentAccessToken,
} from "../access/accessToken";
import {
  INSTRUMENT_EVENT_TYPE,
} from "../eventTypes";
import {
  INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
} from "../stream";

export type InstitutionalInstrumentAccessResolutionClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentAccessGrant"
    | "domainEvent"
  >;

export async function resolveInstitutionalInstrumentAccessWithClient(params: {
  client: InstitutionalInstrumentAccessResolutionClient;
  instrumentReference: string;
  token: string;
  at?: Date;
  recordAccess?: boolean;
}) {
  const token =
    params.token.trim();

  if (!token) {
    return null;
  }

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
        status: true,
        currentVersion: true,
      },
    });

  if (!instrument) {
    return null;
  }

  const now =
    params.at ??
    new Date();

  const grant =
    await params.client.instrumentAccessGrant.findUnique({
      where: {
        codeHash:
          hashInstrumentAccessToken(
            token,
          ),
      },
      select: {
        id: true,
        instrumentId: true,
        recipientUserId: true,
        recipientName: true,
        representedInstitution: true,
        representativeCapacity: true,
        instrumentVersionId: true,
        recipientRole: true,
        accessLevel: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        firstAccessAt: true,
        lastAccessAt: true,
      },
    });

  if (!grant) {
    return null;
  }

  if (
    grant.instrumentId !==
    instrument.id
  ) {
    return null;
  }

  if (grant.revokedAt) {
    return null;
  }

  if (
    grant.expiresAt &&
    grant.expiresAt.getTime() <=
      now.getTime()
  ) {
    return null;
  }

  let firstAccessAt =
    grant.firstAccessAt;

  let lastAccessAt =
    grant.lastAccessAt;

  if (params.recordAccess) {
    /*
     * This method must run inside the caller's transaction
     * whenever access recording is enabled.
     *
     * updateMany guards against a grant being revoked or
     * expiring between initial resolution and recording.
     */
    const stillValid = {
      id:
        grant.id,
      revokedAt:
        null,
      OR: [
        {
          expiresAt:
            null,
        },
        {
          expiresAt: {
            gt:
              now,
          },
        },
      ],
    } as const;

    if (!grant.firstAccessAt) {
      const firstAccess =
        await params.client.instrumentAccessGrant.updateMany({
          where: {
            ...stillValid,
            firstAccessAt:
              null,
          },
          data: {
            firstAccessAt:
              now,
            lastAccessAt:
              now,
          },
        });

      if (firstAccess.count === 0) {
        const repeatedAccess =
          await params.client.instrumentAccessGrant.updateMany({
            where:
              stillValid,
            data: {
              lastAccessAt:
                now,
            },
          });

        if (
          repeatedAccess.count === 0
        ) {
          return null;
        }
      } else {
        firstAccessAt =
          now;
      }
    } else {
      const repeatedAccess =
        await params.client.instrumentAccessGrant.updateMany({
          where:
            stillValid,
          data: {
            lastAccessAt:
              now,
          },
        });

      if (
        repeatedAccess.count === 0
      ) {
        return null;
      }
    }

    lastAccessAt =
      now;

    await params.client.domainEvent.create({
      data: {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId:
          instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_ACCESSED,
        payload: {
          accessGrantId:
            grant.id,
          instrumentReference:
            instrument.reference,
          accessedAt:
            now.toISOString(),
        },
        metadata: {
          accessGrantId:
            grant.id,
          recipientUserId:
            grant.recipientUserId,
          source:
            "instrument.access.resolve",
        },
        occurredAt:
          now,
      },
    });
  }

  return {
    instrument,

    grant: {
      id:
        grant.id,
      recipientUserId:
        grant.recipientUserId,
      recipientName:
        grant.recipientName,
      representedInstitution:
        grant.representedInstitution,
      representativeCapacity:
        grant.representativeCapacity,
      instrumentVersionId:
        grant.instrumentVersionId,
      recipientRole:
        grant.recipientRole,
      accessLevel:
        grant.accessLevel,
      issuedAt:
        grant.issuedAt,
      expiresAt:
        grant.expiresAt,
      firstAccessAt,
      lastAccessAt,
    },
  } as const;
}
