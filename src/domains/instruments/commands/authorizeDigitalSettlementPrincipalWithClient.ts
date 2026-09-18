import type { PrismaClient } from "@prisma/client";

import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type DigitalSettlementPrincipalAuthorizationClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "digitalSettlementInstruction" | "domainEvent"
>;

export async function authorizeDigitalSettlementPrincipalWithClient(params: {
  client: DigitalSettlementPrincipalAuthorizationClient;
  instrumentReference: string;
  actorUserId: string;
  authorizedAt?: Date;
}) {
  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: params.instrumentReference },
    include: { digitalSettlementInstruction: true },
  });

  const settlement = instrument?.digitalSettlementInstruction;

  if (!instrument || !settlement) {
    throw new Error(
      `[DSI_PRINCIPAL_AUTHORIZATION_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (instrument.status !== INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED) {
    throw new Error(
      `[DSI_PRINCIPAL_AUTHORIZATION_INSTRUMENT_NOT_ISSUED] ${instrument.status}`,
    );
  }

  if (
    settlement.settlementStatus ===
      DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER &&
    settlement.principalAuthorizedAt
  ) {
    return {
      authorized: false,
      authorizedAt: settlement.principalAuthorizedAt,
    } as const;
  }

  if (
    settlement.settlementStatus !==
      DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED ||
    !settlement.verificationTxHash ||
    !settlement.verificationConfirmedAt
  ) {
    throw new Error(
      `[DSI_PRINCIPAL_AUTHORIZATION_VERIFICATION_REQUIRED] ${settlement.settlementStatus}`,
    );
  }

  if (
    settlement.pricingStatus !== "FIXED" ||
    !settlement.spotBenchmark ||
    !settlement.spotPricePerKgUsd ||
    !settlement.pricePerKgUsd ||
    !settlement.transactionValueUsd ||
    !settlement.settlementAmountUsd ||
    !settlement.priceFixedAt
  ) {
    throw new Error("[DSI_PRINCIPAL_AUTHORIZATION_PRICE_FIXING_REQUIRED]");
  }

  const authorizedAt = params.authorizedAt ?? new Date();
  const updated = await params.client.digitalSettlementInstruction.updateMany({
    where: {
      id: settlement.id,
      settlementStatus: DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED,
    },
    data: {
      principalAuthorizedAt: authorizedAt,
      settlementStatus: DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
    },
  });

  if (updated.count !== 1) {
    throw new Error("[DSI_PRINCIPAL_AUTHORIZATION_CONCURRENT_TRANSITION]");
  }

  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType: INSTRUMENT_EVENT_TYPE.SETTLEMENT_PRINCIPAL_AUTHORIZED,
      payload: {
        settlementInstructionId: settlement.id,
        verificationTransactionHash: settlement.verificationTxHash,
        from: settlement.settlementStatus,
        to: DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
        authorizedAt: authorizedAt.toISOString(),
      },
      metadata: {
        actorUserId: params.actorUserId,
        source: "instrument.command.authorize-settlement-principal",
      },
      occurredAt: authorizedAt,
    },
  });

  return { authorized: true, authorizedAt } as const;
}
