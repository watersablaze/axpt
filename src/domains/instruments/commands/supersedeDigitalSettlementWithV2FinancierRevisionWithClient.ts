import type { PrismaClient } from "@prisma/client";

import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_VERSION_STATUS,
} from "../contracts";
import { DSI_APPROVED_ISSUANCE_PRICING } from "../definitions/digitalSettlementV1Definition";
import { DSI_V2_FINANCIER_REVISION } from "../definitions/digitalSettlementV2FinancierRevision";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { assertDigitalSettlementCommercialSnapshot } from "../invariants/digitalSettlementCommercialSnapshot";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type DigitalSettlementV2SupersessionClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "instrumentVersion" | "domainEvent"
>;

function decimalString(
  value: { toString(): string } | string | number,
): string {
  return value.toString();
}

function decimalEquals(
  value: { toString(): string } | string | number,
  expected: string,
): boolean {
  const actual = decimalString(value);
  const actualParts = actual.split(".");
  const expectedParts = expected.split(".");

  const scale = Math.max(
    actualParts[1]?.length ?? 0,
    expectedParts[1]?.length ?? 0,
  );

  const normalize = (input: string) => {
    const [whole, fraction = ""] = input.split(".");

    return BigInt(
      `${whole}${fraction.padEnd(scale, "0")}`,
    );
  };

  return normalize(actual) === normalize(expected);
}

export async function supersedeDigitalSettlementWithV2FinancierRevisionWithClient(
  params: {
    client: DigitalSettlementV2SupersessionClient;
    instrumentReference: string;
    actorUserId: string;
  },
) {
  const revision = DSI_V2_FINANCIER_REVISION;

  if (params.instrumentReference !== revision.reference) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_REFERENCE_MISMATCH] ${params.instrumentReference}`,
    );
  }

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference: params.instrumentReference,
      },
      include: {
        versions: true,
        digitalSettlementInstruction: true,
      },
    });

  if (!instrument || !instrument.digitalSettlementInstruction) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const settlement = instrument.digitalSettlementInstruction;

  /*
   * V2 is a governance/participant revision.
   *
   * The canonical DigitalSettlementInstruction remains the settlement
   * authority and must not be rewritten by this command.
   */
  assertDigitalSettlementCommercialSnapshot({
    quantityKg: settlement.quantityKg.toString(),
    pricingStatus: settlement.pricingStatus,
    spotDiscountPercentage:
      settlement.spotDiscountPercentage.toString(),
    spotPricePerKgUsd:
      settlement.spotPricePerKgUsd?.toString() ?? null,
    pricePerKgUsd:
      settlement.pricePerKgUsd?.toString() ?? null,
    transactionValueUsd:
      settlement.transactionValueUsd?.toString() ?? null,
    settlementPercentage:
      settlement.settlementPercentage.toString(),
    settlementAmountUsd:
      settlement.settlementAmountUsd?.toString() ?? null,
    spotBenchmark: settlement.spotBenchmark,
    priceFixedAt: settlement.priceFixedAt,
  });

  if (settlement.pricingStatus !== "FIXED") {
    throw new Error(
      "[DSI_V2_SUPERSESSION_PRICING_NOT_FIXED]",
    );
  }

  if (
    settlement.spotBenchmark !==
      DSI_APPROVED_ISSUANCE_PRICING.spotBenchmark ||
    !settlement.spotPricePerKgUsd ||
    !decimalEquals(
      settlement.spotPricePerKgUsd,
      DSI_APPROVED_ISSUANCE_PRICING.spotPricePerKgUsd,
    ) ||
    !settlement.pricePerKgUsd ||
    !decimalEquals(
      settlement.pricePerKgUsd,
      DSI_APPROVED_ISSUANCE_PRICING.pricePerKgUsd,
    ) ||
    !settlement.transactionValueUsd ||
    !decimalEquals(
      settlement.transactionValueUsd,
      DSI_APPROVED_ISSUANCE_PRICING.transactionValueUsd,
    ) ||
    !settlement.settlementAmountUsd ||
    !decimalEquals(
      settlement.settlementAmountUsd,
      DSI_APPROVED_ISSUANCE_PRICING.settlementAmountUsd,
    )
  ) {
    throw new Error(
      "[DSI_V2_SUPERSESSION_COMMERCIAL_SNAPSHOT_MISMATCH]",
    );
  }

  if (
    settlement.settlementStatus !==
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER
  ) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_SETTLEMENT_STATE_INVALID] ${settlement.settlementStatus}`,
    );
  }

  /*
   * V2 may supersede V1 only while the verification boundary has not
   * advanced. Observation alone is not represented here and grants no
   * authority.
   */
  if (
    settlement.verificationTxHash ||
    settlement.verificationConfirmedAt ||
    settlement.principalAuthorizedAt
  ) {
    throw new Error(
      "[DSI_V2_SUPERSESSION_AUTHORITY_ALREADY_ADVANCED]",
    );
  }

  if (
    !decimalEquals(
      settlement.verificationAmountUsdt,
      "50",
    )
  ) {
    throw new Error(
      "[DSI_V2_SUPERSESSION_VERIFICATION_AMOUNT_MISMATCH]",
    );
  }

  type VersionRecord = {
    id: string;
    number: number;
    status: string;
    issuedAt: Date | null;
    supersededAt: Date | null;
  };

  const v1 = instrument.versions.find(
    (version: VersionRecord) =>
      version.number === revision.supersedesVersion,
  );

  const existingV2 = instrument.versions.find(
    (version: VersionRecord) =>
      version.number === revision.version,
  );

  /*
   * Completed transition retry:
   * do not create another version or emit duplicate events.
   */
  if (instrument.currentVersion === revision.version) {
    if (
      !v1 ||
      !existingV2 ||
      v1.status !== INSTRUMENT_VERSION_STATUS.SUPERSEDED ||
      existingV2.status !==
        INSTRUMENT_VERSION_STATUS.ISSUED ||
      !v1.supersededAt ||
      !existingV2.issuedAt
    ) {
      throw new Error(
        "[DSI_V2_SUPERSESSION_EXISTING_STATE_INCONSISTENT]",
      );
    }

    return {
      instrumentId: instrument.id,
      previousVersionId: v1.id,
      versionId: existingV2.id,
      previousVersionNumber: v1.number,
      versionNumber: existingV2.number,
      transitioned: false,
    } as const;
  }

  if (
    instrument.currentVersion !==
    revision.supersedesVersion
  ) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_CURRENT_VERSION_INVALID] ${instrument.currentVersion}`,
    );
  }

  if (
    instrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_INSTRUMENT_STATE_INVALID] ${instrument.status}`,
    );
  }

  if (!v1) {
    throw new Error(
      "[DSI_V2_SUPERSESSION_V1_MISSING]",
    );
  }

  if (
    v1.status !==
    INSTRUMENT_VERSION_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_V1_STATE_INVALID] ${v1.status}`,
    );
  }

  if (existingV2) {
    throw new Error(
      `[DSI_V2_SUPERSESSION_V2_ALREADY_EXISTS] ${existingV2.status}`,
    );
  }

  const now = new Date();

  const v2 =
    await params.client.instrumentVersion.create({
      data: {
        instrumentId: instrument.id,
        number: revision.version,
        status: INSTRUMENT_VERSION_STATUS.ISSUED,
        createdByUserId: params.actorUserId,
        issuedAt: now,
      },
      select: {
        id: true,
        number: true,
        status: true,
        issuedAt: true,
      },
    });

  await params.client.instrumentVersion.update({
    where: {
      id: v1.id,
    },
    data: {
      status: INSTRUMENT_VERSION_STATUS.SUPERSEDED,
      supersededAt: now,
    },
  });

  await params.client.institutionalInstrument.update({
    where: {
      id: instrument.id,
    },
    data: {
      currentVersion: revision.version,
    },
  });

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_CREATED,
        payload: {
          versionId: v2.id,
          versionNumber: v2.number,
          supersedesVersion: v1.number,
          revisionTitle: revision.revisionTitle,
          revisionBasis: revision.revisionBasis,
        },
        metadata: {
          actorUserId: params.actorUserId,
          source:
            "instrument.command.supersede-digital-settlement-v2",
        },
        occurredAt: now,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_SUPERSEDED,
        payload: {
          versionId: v1.id,
          versionNumber: v1.number,
          supersededByVersionId: v2.id,
          supersededByVersionNumber: v2.number,
          supersededAt: now.toISOString(),
        },
        metadata: {
          actorUserId: params.actorUserId,
          source:
            "instrument.command.supersede-digital-settlement-v2",
        },
        occurredAt: now,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_ISSUED,
        payload: {
          versionId: v2.id,
          versionNumber: v2.number,
          supersedesVersion: v1.number,
          issuedAt: now.toISOString(),
          revisionTitle: revision.revisionTitle,
        },
        metadata: {
          actorUserId: params.actorUserId,
          source:
            "instrument.command.supersede-digital-settlement-v2",
        },
        occurredAt: now,
      },
    ],
  });

  return {
    instrumentId: instrument.id,
    previousVersionId: v1.id,
    versionId: v2.id,
    previousVersionNumber: v1.number,
    versionNumber: v2.number,
    transitioned: true,
  } as const;
}
