import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_ACCESS_TOKEN_BYTES,
  INSTRUMENT_PARTY_ROLE,
  canRespondAtAccessLevel,
  type InstrumentAccessLevel,
  type InstrumentPartyRole,
} from "../contracts";
import { hashInstrumentAccessToken } from "../access/accessToken";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentAccessGrantIssuanceClient = Pick<
  PrismaClient,
  | "institutionalInstrument"
  | "instrumentAccessGrant"
  | "user"
  | "instrumentVersion"
  | "domainEvent"
>;

export async function issueInstrumentAccessGrantWithClient(params: {
  client: InstrumentAccessGrantIssuanceClient;
  instrumentReference: string;
  instrumentVersionNumber?: number;
  recipientName: string;
  recipientUserId?: string | null;
  versionNumber?: number;
  representedInstitution?: string;
  representativeCapacity?: string;
  recipientRole?: InstrumentPartyRole;
  accessLevel?: InstrumentAccessLevel;
  issuedByUserId: string;
  expiresAt: Date;
}) {
  const recipientName = params.recipientName.trim();

  if (!recipientName) {
    throw new Error(
      "[INSTRUMENT_ACCESS_RECIPIENT_REQUIRED]",
    );
  }

  if (
    params.expiresAt.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "[INSTRUMENT_ACCESS_EXPIRY_MUST_BE_FUTURE]",
    );
  }

  if (params.instrumentVersionNumber !== undefined &&
      (!Number.isInteger(params.instrumentVersionNumber) || params.instrumentVersionNumber <= 0)) {
    throw new Error("[INSTRUMENT_ACCESS_VERSION_NUMBER_INVALID]");
  }
  if (params.versionNumber !== undefined &&
      (!Number.isInteger(params.versionNumber) || params.versionNumber <= 0)) {
    throw new Error("[INSTRUMENT_ACCESS_VERSION_NUMBER_INVALID]");
  }
  if (params.versionNumber !== undefined && params.instrumentVersionNumber !== undefined) {
    throw new Error("[INSTRUMENT_ACCESS_VERSION_ARGUMENT_AMBIGUOUS]");
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
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_ACCESS_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const recipientRole =
    params.recipientRole ??
    INSTRUMENT_PARTY_ROLE
      .COMMERCIAL_PARTICIPANT;

  const accessLevel =
    params.accessLevel ??
    INSTRUMENT_ACCESS_LEVEL.VIEW;

  const recipientUserId =
    params.recipientUserId ?? null;

  /*
   * Institutional response authority must resolve
   * to an attributable AXPT user identity.
   *
   * A named controlled link remains sufficient for
   * VIEW access, but not for RESPOND, DELIBERATE,
   * or ADMINISTER.
   */
  if (
    canRespondAtAccessLevel(accessLevel) &&
    !recipientUserId
  ) {
    throw new Error(
      "[INSTRUMENT_ACCESS_RESPONSE_IDENTITY_REQUIRED]",
    );
  }

  if (recipientUserId) {
    const recipientUser =
      await params.client.user.findUnique({
        where: {
          id: recipientUserId,
        },
        select: {
          id: true,
        },
      });

    if (!recipientUser) {
      throw new Error(
        `[INSTRUMENT_ACCESS_RECIPIENT_USER_NOT_FOUND] ${recipientUserId}`,
      );
    }
  }

  const representedInstitution = params.representedInstitution?.trim() || null;
  const representativeCapacity = params.representativeCapacity?.trim() || null;
  if (params.versionNumber !== undefined &&
      (!recipientUserId || !canRespondAtAccessLevel(accessLevel) ||
       !representedInstitution || !representativeCapacity)) {
    throw new Error("[INSTRUMENT_ACCESS_VERSION_IDENTITY_REQUIRED]");
  }
  const version = params.versionNumber !== undefined
    ? await params.client.instrumentVersion.findFirst({
        where: { instrumentId: instrument.id, number: params.versionNumber, status: "ISSUED" },
        select: { id: true, number: true, status: true },
      })
    : params.instrumentVersionNumber !== undefined
      ? await params.client.instrumentVersion.findUnique({
          where: {
            instrumentId_number: {
              instrumentId: instrument.id,
              number: params.instrumentVersionNumber,
            },
          },
          select: { id: true, number: true, status: true },
        })
      : null;
  if (params.versionNumber !== undefined && !version) {
    throw new Error("[INSTRUMENT_ACCESS_ISSUED_VERSION_REQUIRED]");
  }
  if (params.instrumentVersionNumber !== undefined && !version) {
    throw new Error(
      `[INSTRUMENT_ACCESS_VERSION_NOT_FOUND] reference=${params.instrumentReference} version=${params.instrumentVersionNumber}`,
    );
  }

  const token = randomBytes(
    INSTRUMENT_ACCESS_TOKEN_BYTES,
  ).toString("base64url");

  const codeHash =
    hashInstrumentAccessToken(token);

  const issuedAt = new Date();

  const grant =
    await params.client.instrumentAccessGrant.create({
      data: {
        instrumentId:
          instrument.id,
        recipientUserId,
        recipientName,
        representedInstitution,
        representativeCapacity,
        instrumentVersionId: version?.id ?? null,
        recipientRole,
        accessLevel,
        codeHash,
        issuedByUserId:
          params.issuedByUserId,
        issuedAt,
        expiresAt:
          params.expiresAt,
      },
      select: {
        id: true,
        recipientUserId: true,
        recipientName: true,
        representedInstitution: true,
        representativeCapacity: true,
        instrumentVersionId: true,
        recipientRole: true,
        accessLevel: true,
        expiresAt: true,
      },
    });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_ACCESS_GRANTED,
      payload: {
        accessGrantId:
          grant.id,
        recipientUserId:
          grant.recipientUserId,
        recipientName:
          grant.recipientName,
        instrumentVersionId: grant.instrumentVersionId,
        instrumentVersionNumber: version?.number ?? null,
        recipientRole:
          grant.recipientRole,
        accessLevel:
          grant.accessLevel,
        expiresAt:
          grant.expiresAt?.toISOString() ??
          null,
      },
      metadata: {
        actorUserId:
          params.issuedByUserId,
        source:
          "instrument.command.issue-access-grant",
      },
      occurredAt:
        issuedAt,
    },
  });

  return {
    grant,
    token,
    instrumentVersion: version
      ? { id: version.id, number: version.number, status: version.status }
      : null,
  } as const;
}
