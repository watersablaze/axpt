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
} from "../definitions/digitalSettlementV2FinancierRevision";
import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "./issueInstrumentAccessGrantWithClient";

/*
 * This batch intentionally does not open its own transaction.
 *
 * Transaction ownership is a call-site invariant:
 * the eventual V2 issuance orchestrator must invoke this command with
 * the Prisma transaction client that also performs V1 supersession,
 * V2 issuance, and the related version/access event writes.
 *
 * InstrumentAccessGrantIssuanceClient already exposes exactly the
 * delegates required by this batch.
 *
 * Raw access credentials exist only in the return value and must be
 * consumed after the database transaction commits.
 */
export type DigitalSettlementV2AccessGrantIssuanceClient =
  InstrumentAccessGrantIssuanceClient;

export type DigitalSettlementV2IssuedAccessGrant = Readonly<{
  key: DigitalSettlementV2AccessPlanEntry["key"];
  recipientName: string;
  email: string;
  accessPurpose: DigitalSettlementV2AccessPlanEntry["accessPurpose"];
  authority: DigitalSettlementV2AccessPlanEntry["authority"];
  authorizedAmountUsdt: string | null;
  grant: {
    id: string;
    instrumentVersionId: string | null;
    recipientName: string | null;
    accessLevel: string;
    expiresAt: Date | null;
  };
  token: string;
  instrumentVersion: {
    id: string;
    number: number;
    status: string;
  };
}>;

export async function issueDigitalSettlementV2AccessGrantsWithClient(
  params: {
    client: DigitalSettlementV2AccessGrantIssuanceClient;
    instrumentReference: string;
    issuedByUserId: string;
    expiresAt: Date;
  },
): Promise<readonly DigitalSettlementV2IssuedAccessGrant[]> {
  if (
    params.instrumentReference !==
    DSI_V2_FINANCIER_REVISION.reference
  ) {
    throw new Error(
      `[DSI_V2_ACCESS_REFERENCE_MISMATCH] ${params.instrumentReference}`,
    );
  }

  if (params.expiresAt.getTime() <= Date.now()) {
    throw new Error(
      "[DSI_V2_ACCESS_EXPIRY_MUST_BE_FUTURE]",
    );
  }

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
      `[DSI_V2_ACCESS_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (
    instrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_ACCESS_INSTRUMENT_STATE_INVALID] ${instrument.status}`,
    );
  }

  if (
    instrument.currentVersion !==
    DSI_V2_VERSION
  ) {
    throw new Error(
      `[DSI_V2_ACCESS_CURRENT_VERSION_INVALID] ${instrument.currentVersion}`,
    );
  }

  const v2 =
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

  if (!v2) {
    throw new Error(
      "[DSI_V2_ACCESS_VERSION_NOT_FOUND]",
    );
  }

  if (
    v2.status !==
    INSTRUMENT_VERSION_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_ACCESS_VERSION_STATE_INVALID] ${v2.status}`,
    );
  }

  if (DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.length !== 5) {
    throw new Error(
      `[DSI_V2_ACCESS_PLAN_COUNT_INVALID] ${DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.length}`,
    );
  }

  const results: DigitalSettlementV2IssuedAccessGrant[] = [];

  for (const entry of DIGITAL_SETTLEMENT_V2_ACCESS_PLAN) {
    if (
      entry.instrumentVersionNumber !==
      DSI_V2_VERSION
    ) {
      throw new Error(
        `[DSI_V2_ACCESS_PLAN_VERSION_INVALID] key=${entry.key} version=${entry.instrumentVersionNumber}`,
      );
    }

    const issuance =
      await issueInstrumentAccessGrantWithClient({
        client: params.client,
        instrumentReference: params.instrumentReference,
        instrumentVersionNumber:
          entry.instrumentVersionNumber,
        recipientName: entry.recipientName,
        recipientRole: entry.recipientRole,
        accessLevel: entry.accessLevel,
        issuedByUserId: params.issuedByUserId,
        expiresAt: params.expiresAt,
      });

    if (!issuance.instrumentVersion) {
      throw new Error(
        `[DSI_V2_ACCESS_VERSION_BINDING_MISSING] key=${entry.key}`,
      );
    }

    if (
      issuance.instrumentVersion.id !== v2.id ||
      issuance.instrumentVersion.number !==
        DSI_V2_VERSION ||
      issuance.grant.instrumentVersionId !== v2.id
    ) {
      throw new Error(
        `[DSI_V2_ACCESS_VERSION_BINDING_MISMATCH] key=${entry.key}`,
      );
    }

    results.push({
      key: entry.key,
      recipientName: entry.recipientName,
      email: entry.email,
      accessPurpose: entry.accessPurpose,
      authority: entry.authority,
      authorizedAmountUsdt:
        entry.authorizedAmountUsdt,
      grant: issuance.grant,
      token: issuance.token,
      instrumentVersion: issuance.instrumentVersion,
    });
  }

  if (results.length !== 5) {
    throw new Error(
      `[DSI_V2_ACCESS_ISSUANCE_COUNT_INVALID] ${results.length}`,
    );
  }

  return results;
}
