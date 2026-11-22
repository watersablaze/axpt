import type { PrismaClient } from "@prisma/client";

import { DIGITAL_SETTLEMENT_PRICING_STATUS } from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { assertDigitalSettlementCommercialSnapshot } from "../invariants/digitalSettlementCommercialSnapshot";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type DigitalSettlementPriceFixingClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "digitalSettlementInstruction" | "domainEvent"
>;

function parseCents(value: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());

  if (!match) {
    throw new Error(`[DSI_SPOT_PRICE_INVALID] ${value}`);
  }

  return BigInt(`${match[1]}${(match[2] ?? "").padEnd(2, "0")}`);
}

function centsToString(value: bigint): string {
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

export async function fixDigitalSettlementPricingWithClient(params: {
  client: DigitalSettlementPriceFixingClient;
  instrumentReference: string;
  spotPricePerKgUsd: string;
  spotBenchmark: string;
  actorUserId: string;
  fixedAt?: Date;
}) {
  const spotBenchmark = params.spotBenchmark.trim();

  if (!spotBenchmark) {
    throw new Error("[DSI_SPOT_BENCHMARK_REQUIRED]");
  }

  const spotPriceCents = parseCents(params.spotPricePerKgUsd);

  if (spotPriceCents <= 0n) {
    throw new Error("[DSI_SPOT_PRICE_MUST_BE_POSITIVE]");
  }

  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: params.instrumentReference },
    include: { digitalSettlementInstruction: true },
  });
  const settlement = instrument?.digitalSettlementInstruction;

  if (!instrument || !settlement) {
    throw new Error(
      `[DSI_PRICE_FIXING_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (settlement.principalAuthorizedAt) {
    throw new Error("[DSI_PRICE_FIXING_PRINCIPAL_ALREADY_AUTHORIZED]");
  }

  const discountUnits = BigInt(
    Math.round(Number(settlement.spotDiscountPercentage.toString()) * 10_000),
  );
  const quantityMicros = BigInt(
    Math.round(Number(settlement.quantityKg.toString()) * 1_000_000),
  );
  const percentageUnits = BigInt(
    Math.round(Number(settlement.settlementPercentage.toString()) * 10_000),
  );
  const purchasePriceCents = divideRoundHalfUp(
    spotPriceCents * (1_000_000n - discountUnits),
    1_000_000n,
  );
  const transactionValueCents = divideRoundHalfUp(
    quantityMicros * purchasePriceCents,
    1_000_000n,
  );
  const settlementAmountCents = divideRoundHalfUp(
    transactionValueCents * percentageUnits,
    1_000_000n,
  );
  const fixedAt = params.fixedAt ?? new Date();
  const snapshot = {
    pricingStatus: DIGITAL_SETTLEMENT_PRICING_STATUS.FIXED,
    quantityKg: settlement.quantityKg.toString(),
    spotDiscountPercentage: settlement.spotDiscountPercentage.toString(),
    spotPricePerKgUsd: centsToString(spotPriceCents),
    pricePerKgUsd: centsToString(purchasePriceCents),
    transactionValueUsd: centsToString(transactionValueCents),
    settlementPercentage: settlement.settlementPercentage.toString(),
    settlementAmountUsd: centsToString(settlementAmountCents),
    spotBenchmark,
    priceFixedAt: fixedAt,
  } as const;

  assertDigitalSettlementCommercialSnapshot(snapshot);

  if (settlement.pricingStatus === DIGITAL_SETTLEMENT_PRICING_STATUS.FIXED) {
    const matches =
      settlement.spotPricePerKgUsd?.toString() === snapshot.spotPricePerKgUsd &&
      settlement.pricePerKgUsd?.toString() === snapshot.pricePerKgUsd &&
      settlement.transactionValueUsd?.toString() ===
        snapshot.transactionValueUsd &&
      settlement.settlementAmountUsd?.toString() ===
        snapshot.settlementAmountUsd &&
      settlement.spotBenchmark === snapshot.spotBenchmark;

    if (!matches) {
      throw new Error("[DSI_PRICE_FIXING_ALREADY_FIXED_MISMATCH]");
    }

    return { fixed: false, snapshot } as const;
  }

  const updated = await params.client.digitalSettlementInstruction.updateMany({
    where: {
      id: settlement.id,
      pricingStatus: DIGITAL_SETTLEMENT_PRICING_STATUS.PENDING_FIXING,
      principalAuthorizedAt: null,
    },
    data: snapshot,
  });

  if (updated.count !== 1) {
    throw new Error("[DSI_PRICE_FIXING_CONCURRENT_TRANSITION]");
  }

  await params.client.domainEvent.create({
    data: {
      streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType: INSTRUMENT_EVENT_TYPE.SETTLEMENT_PRICE_FIXED,
      payload: {
        settlementInstructionId: settlement.id,
        pricingBasis: settlement.pricingBasis,
        ...snapshot,
        priceFixedAt: fixedAt.toISOString(),
      },
      metadata: {
        actorUserId: params.actorUserId,
        source: "instrument.command.fix-settlement-pricing",
      },
      occurredAt: fixedAt,
    },
  });

  return { fixed: true, snapshot } as const;
}
