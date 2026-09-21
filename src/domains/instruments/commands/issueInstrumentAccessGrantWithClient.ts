import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_ACCESS_TOKEN_BYTES,
  INSTRUMENT_PARTY_ROLE,
  type InstrumentAccessLevel,
  type InstrumentPartyRole,
} from "../contracts";
import { hashInstrumentAccessToken } from "../access/accessToken";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentAccessGrantIssuanceClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentVersion"
  | "instrumentAccessGrant"
  | "domainEvent"
>;

export async function issueInstrumentAccessGrantWithClient(params: {
  client: InstrumentAccessGrantIssuanceClient;
  instrumentReference: string;
  instrumentVersionNumber?: number;
  recipientName: string;
  recipientRole?: InstrumentPartyRole;
  accessLevel?: InstrumentAccessLevel;
  issuedByUserId: string;
  expiresAt: Date;
}) {
  const recipientName = params.recipientName.trim();

  if (!recipientName) {
    throw new Error("[INSTRUMENT_ACCESS_RECIPIENT_REQUIRED]");
  }

  if (params.expiresAt.getTime() <= Date.now()) {
    throw new Error("[INSTRUMENT_ACCESS_EXPIRY_MUST_BE_FUTURE]");
  }

  if (
    params.instrumentVersionNumber !== undefined &&
    (!Number.isInteger(params.instrumentVersionNumber) ||
      params.instrumentVersionNumber <= 0)
  ) {
    throw new Error("[INSTRUMENT_ACCESS_VERSION_NUMBER_INVALID]");
  }

  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: params.instrumentReference },
    select: { id: true, reference: true },
  });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_ACCESS_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const instrumentVersion =
    params.instrumentVersionNumber === undefined
      ? null
      : await params.client.instrumentVersion.findUnique({
          where: {
            instrumentId_number: {
              instrumentId: instrument.id,
              number: params.instrumentVersionNumber,
            },
          },
          select: {
            id: true,
            number: true,
            status: true,
          },
        });

  if (
    params.instrumentVersionNumber !== undefined &&
    !instrumentVersion
  ) {
    throw new Error(
      `[INSTRUMENT_ACCESS_VERSION_NOT_FOUND] reference=${params.instrumentReference} version=${params.instrumentVersionNumber}`,
    );
  }

  const token = randomBytes(INSTRUMENT_ACCESS_TOKEN_BYTES).toString(
    "base64url",
  );
  const codeHash = hashInstrumentAccessToken(token);
  const issuedAt = new Date();
  const recipientRole =
    params.recipientRole ?? INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT;
  const accessLevel = params.accessLevel ?? INSTRUMENT_ACCESS_LEVEL.VIEW;

  const grant = await params.client.instrumentAccessGrant.create({
    data: {
      instrumentId: instrument.id,
      instrumentVersionId: instrumentVersion?.id ?? null,
      recipientName,
      recipientRole,
      accessLevel,
      codeHash,
      issuedByUserId: params.issuedByUserId,
      issuedAt,
      expiresAt: params.expiresAt,
    },
    select: {
      id: true,
      instrumentVersionId: true,
      recipientName: true,
      accessLevel: true,
      expiresAt: true,
    },
  });

  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_ACCESS_GRANTED,
      payload: {
        accessGrantId: grant.id,
        instrumentVersionId: grant.instrumentVersionId,
        instrumentVersionNumber: instrumentVersion?.number ?? null,
        recipientName: grant.recipientName,
        accessLevel: grant.accessLevel,
        expiresAt: grant.expiresAt?.toISOString() ?? null,
      },
      metadata: {
        actorUserId: params.issuedByUserId,
        source: "instrument.command.issue-access-grant",
      },
      occurredAt: issuedAt,
    },
  });

  return {
    grant,
    token,
    instrumentVersion: instrumentVersion
      ? {
          id: instrumentVersion.id,
          number: instrumentVersion.number,
          status: instrumentVersion.status,
        }
      : null,
  } as const;
}
