import type { PrismaClient } from "@prisma/client";

import {
  type InstrumentResponseType,
} from "../contracts";

import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "../queries/resolveInstitutionalInstrumentAccessWithClient";

import {
  recordInstrumentResponseWithClient,
} from "./recordInstrumentResponseWithClient";

export type InstrumentTokenBoundResponseClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "instrumentProposition"
    | "instrumentAccessGrant"
    | "instrumentResponse"
    | "domainEvent"
  >;

export async function submitInstrumentResponseWithTokenWithClient(
  params: {
    client:
      InstrumentTokenBoundResponseClient;

    instrumentReference:
      string;

    token:
      string;

    propositionReference:
      string;

    responseType:
      InstrumentResponseType;

    note?:
      string | null;

    correlationId:
      string;

    occurredAt?:
      Date;
  },
) {
  const access =
    await resolveInstitutionalInstrumentAccessWithClient({
      client:
        params.client,
      instrumentReference:
        params.instrumentReference,
      token:
        params.token,
      at:
        params.occurredAt,
      recordAccess:
        false,
    });

  if (!access) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_ACCESS_INVALID]",
    );
  }

  const actorUserId =
    access.grant.recipientUserId;

  if (!actorUserId) {
    throw new Error(
      "[INSTRUMENT_RESPONSE_IDENTITY_REQUIRED]",
    );
  }

  /*
   * The response command remains the canonical
   * enforcement boundary for:
   *
   * - grant/instrument ownership
   * - revocation / expiry
   * - response-capable access level
   * - actor/grant identity equivalence
   * - supersession
   * - response events
   *
   * This application service only derives the actor
   * from the controlled bearer grant and never accepts
   * actorUserId from the request.
   */
  const response =
    await recordInstrumentResponseWithClient({
      client:
        params.client,
      instrumentReference:
        params.instrumentReference,
      propositionReference:
        params.propositionReference,
      responseType:
        params.responseType,
      note:
        params.note ?? undefined,
      context: {
        actorUserId,
        accessGrantId:
          access.grant.id,
        correlationId:
          params.correlationId,
        occurredAt:
          params.occurredAt,
      },
    });

  return {
    access: {
      grantId:
        access.grant.id,
      actorUserId,
      accessLevel:
        access.grant.accessLevel,
    },

    response,
  } as const;
}
