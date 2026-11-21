type CommercialSnapshot = Readonly<{
  quantityKg: string;
  pricingStatus: string;
  spotDiscountPercentage: string;
  spotPricePerKgUsd: string | null;
  pricePerKgUsd: string | null;
  transactionValueUsd: string | null;
  settlementPercentage: string;
  settlementAmountUsd: string | null;
  spotBenchmark: string | null;
  priceFixedAt: Date | null;
}>;

function parseScaledDecimal(value: string, decimals: number): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);

  if (!match) {
    throw new Error(`[DSI_COMMERCIAL_DECIMAL_INVALID] value=${value}`);
  }

  const fraction = match[2] ?? "";

  if (fraction.length > decimals) {
    throw new Error(
      `[DSI_COMMERCIAL_DECIMAL_PRECISION] value=${value} decimals=${decimals}`,
    );
  }

  return BigInt(`${match[1]}${fraction.padEnd(decimals, "0")}`);
}

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

export function assertDigitalSettlementCommercialSnapshot(
  snapshot: CommercialSnapshot,
): void {
  if (snapshot.pricingStatus === "PENDING_FIXING") {
    if (
      snapshot.spotPricePerKgUsd !== null ||
      snapshot.pricePerKgUsd !== null ||
      snapshot.transactionValueUsd !== null ||
      snapshot.settlementAmountUsd !== null ||
      snapshot.spotBenchmark !== null ||
      snapshot.priceFixedAt !== null
    ) {
      throw new Error("[DSI_PENDING_FIXING_HAS_FIXED_VALUES]");
    }

    return;
  }

  if (snapshot.pricingStatus !== "FIXED") {
    throw new Error(`[DSI_PRICING_STATUS_INVALID] ${snapshot.pricingStatus}`);
  }

  if (
    !snapshot.spotPricePerKgUsd ||
    !snapshot.pricePerKgUsd ||
    !snapshot.transactionValueUsd ||
    !snapshot.settlementAmountUsd ||
    !snapshot.spotBenchmark?.trim() ||
    !snapshot.priceFixedAt
  ) {
    throw new Error("[DSI_FIXED_PRICING_INCOMPLETE]");
  }

  const quantityMicros = parseScaledDecimal(snapshot.quantityKg, 6);
  const spotPriceCents = parseScaledDecimal(snapshot.spotPricePerKgUsd, 2);
  const discountUnits = parseScaledDecimal(snapshot.spotDiscountPercentage, 4);
  const priceCents = parseScaledDecimal(snapshot.pricePerKgUsd, 2);
  const transactionValueCents = parseScaledDecimal(
    snapshot.transactionValueUsd,
    2,
  );
  const settlementPercentageUnits = parseScaledDecimal(
    snapshot.settlementPercentage,
    4,
  );
  const settlementAmountCents = parseScaledDecimal(
    snapshot.settlementAmountUsd,
    2,
  );

  const expectedPriceCents = divideRoundHalfUp(
    spotPriceCents * (1_000_000n - discountUnits),
    1_000_000n,
  );

  if (expectedPriceCents !== priceCents) {
    throw new Error(
      `[DSI_PURCHASE_PRICE_MISMATCH] expected=${expectedPriceCents} actual=${priceCents}`,
    );
  }

  const expectedTransactionValueCents = divideRoundHalfUp(
    quantityMicros * priceCents,
    1_000_000n,
  );

  if (expectedTransactionValueCents !== transactionValueCents) {
    throw new Error(
      `[DSI_TRANSACTION_VALUE_MISMATCH] expected=${expectedTransactionValueCents} actual=${transactionValueCents}`,
    );
  }

  const expectedSettlementAmountCents = divideRoundHalfUp(
    transactionValueCents * settlementPercentageUnits,
    1_000_000n,
  );

  if (expectedSettlementAmountCents !== settlementAmountCents) {
    throw new Error(
      `[DSI_SETTLEMENT_AMOUNT_MISMATCH] expected=${expectedSettlementAmountCents} actual=${settlementAmountCents}`,
    );
  }
}
