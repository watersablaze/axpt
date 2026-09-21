import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";
import {
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN,
  type DigitalSettlementV2AccessPlanEntry,
} from "../definitions/digitalSettlementV2AccessPlan";
import {
  DSI_V2_FINANCIER_REVISION,
  DSI_V2_VERSION,
  type DigitalSettlementV2RecipientKey,
} from "../definitions/digitalSettlementV2FinancierRevision";
import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "./issueInstrumentAccessGrantWithClient";
import {
  revokeInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantRevocationClient,
} from "./revokeInstrumentAccessGrantWithClient";

export type DigitalSettlementV2DeliveryRecoveryClient =
  InstrumentAccessGrantIssuanceClient &
  InstrumentAccessGrantRevocationClient &
  Pick<PrismaClient, "emailLog">;

function accessPlanEntry(
  recipientKey: DigitalSettlementV2RecipientKey,
): DigitalSettlementV2AccessPlanEntry {
  const entry = DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.find(
    (candidate) => candidate.key === recipientKey,
  );

  if (!entry) {
    throw new Error(
      `[DSI_V2_RECOVERY_RECIPIENT_INVALID] ${recipientKey}`,
    );
  }

  return entry;
}

/*
 * Atomic database half of one-recipient V2 delivery recovery.
 *
 * This command:
 * - requires V2 to already be the current issued version;
 * - refuses recovery when durable EmailLog evidence says the current grant
 *   was successfully SENT;
 * - revokes exactly one current undelivered V2 grant;
 * - creates exactly one replacement grant bound to V2;
 * - returns the replacement bearer token only in memory.
 *
 * The caller must own the Prisma transaction.
 * External delivery must happen only after commit.
 */
export async function recoverDigitalSettlementV2DeliveryGrantWithClient(
  params: {
    client: DigitalSettlementV2DeliveryRecoveryClient;
    instrumentReference: string;
    recipientKey: DigitalSettlementV2RecipientKey;
    actorUserId: string;
    accessExpiresAt: Date;
  },
) {
  if (
    params.instrumentReference !==
    DSI_V2_FINANCIER_REVISION.reference
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_REFERENCE_MISMATCH] ${params.instrumentReference}`,
    );
  }

  if (params.accessExpiresAt.getTime() <= Date.now()) {
    throw new Error(
      "[DSI_V2_RECOVERY_EXPIRY_MUST_BE_FUTURE]",
    );
  }

  const entry = accessPlanEntry(params.recipientKey);

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference: params.instrumentReference,
      },
      select: {
        id: true,
        status: true,
        currentVersion: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[DSI_V2_RECOVERY_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (
    instrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_INSTRUMENT_STATE_INVALID] ${instrument.status}`,
    );
  }

  if (instrument.currentVersion !== DSI_V2_VERSION) {
    throw new Error(
      `[DSI_V2_RECOVERY_CURRENT_VERSION_INVALID] ${instrument.currentVersion}`,
    );
  }

  const version =
    await params.client.instrumentVersion.findUnique({
      where: {
        instrumentId_number: {
          instrumentId: instrument.id,
          number: DSI_V2_VERSION,
        },
      },
      select: {
        id: true,
        number: true,
        status: true,
      },
    });

  if (!version) {
    throw new Error(
      "[DSI_V2_RECOVERY_VERSION_NOT_FOUND]",
    );
  }

  if (
    version.status !==
    INSTRUMENT_VERSION_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_VERSION_STATE_INVALID] ${version.status}`,
    );
  }

  const activeGrants =
    await params.client.instrumentAccessGrant.findMany({
      where: {
        instrumentId: instrument.id,
        instrumentVersionId: version.id,
        recipientName: entry.recipientName,
        accessLevel: entry.accessLevel,
        revokedAt: null,
      },
      select: {
        id: true,
        instrumentVersionId: true,
        recipientName: true,
        accessLevel: true,
        expiresAt: true,
      },
      orderBy: {
        issuedAt: "desc",
      },
    });

  if (activeGrants.length === 0) {
    throw new Error(
      `[DSI_V2_RECOVERY_ACTIVE_GRANT_NOT_FOUND] ${params.recipientKey}`,
    );
  }

  if (activeGrants.length !== 1) {
    throw new Error(
      `[DSI_V2_RECOVERY_ACTIVE_GRANT_AMBIGUOUS] key=${params.recipientKey} count=${activeGrants.length}`,
    );
  }

  const currentGrant = activeGrants[0];

  const deliveryKey =
    `DSI_V2_${DSI_V2_VERSION}` +
    `_${currentGrant.id}_${params.recipientKey}`;

  const successfulDelivery =
    await params.client.emailLog.findFirst({
      where: {
        type: deliveryKey,
        to: entry.email,
        status: "SENT",
      },
      select: {
        id: true,
        messageId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (successfulDelivery) {
    throw new Error(
      `[DSI_V2_RECOVERY_DELIVERY_ALREADY_SUCCESSFUL] key=${params.recipientKey} grant=${currentGrant.id}`,
    );
  }

  const revocation =
    await revokeInstrumentAccessGrantWithClient({
      client: params.client,
      accessGrantId: currentGrant.id,
      revokedByUserId: params.actorUserId,
    });

  if (!revocation.revoked) {
    throw new Error(
      `[DSI_V2_RECOVERY_GRANT_ALREADY_REVOKED] ${currentGrant.id}`,
    );
  }

  const replacement =
    await issueInstrumentAccessGrantWithClient({
      client: params.client,
      instrumentReference: params.instrumentReference,
      instrumentVersionNumber: DSI_V2_VERSION,
      recipientName: entry.recipientName,
      recipientRole: entry.recipientRole,
      accessLevel: entry.accessLevel,
      issuedByUserId: params.actorUserId,
      expiresAt: params.accessExpiresAt,
    });

  if (
    !replacement.instrumentVersion ||
    replacement.instrumentVersion.id !== version.id ||
    replacement.instrumentVersion.number !== DSI_V2_VERSION ||
    replacement.grant.instrumentVersionId !== version.id
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_REPLACEMENT_VERSION_BINDING_INVALID] ${params.recipientKey}`,
    );
  }

  return {
    key: entry.key,
    recipientName: entry.recipientName,
    email: entry.email,
    accessPurpose: entry.accessPurpose,
    authority: entry.authority,
    authorizedAmountUsdt: entry.authorizedAmountUsdt,

    replacedGrantId: currentGrant.id,

    grant: replacement.grant,
    token: replacement.token,

    instrumentVersion: replacement.instrumentVersion,
  } as const;
}
