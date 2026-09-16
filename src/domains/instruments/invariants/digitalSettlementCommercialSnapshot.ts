type CommercialSnapshot = Readonly<{
  quantityKg: string;
  pricePerKgUsd: string;
  transactionValueUsd: string;
  settlementPercentage: string;
  settlementAmountUsd: string;
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

export function assertDigitalSettlementCommercialSnapshot(
  snapshot: CommercialSnapshot,
): void {
  const quantityMicros = parseScaledDecimal(snapshot.quantityKg, 6);
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

  const expectedTransactionValueCents =
    (quantityMicros * priceCents) / 1_000_000n;

  if (expectedTransactionValueCents !== transactionValueCents) {
    throw new Error(
      `[DSI_TRANSACTION_VALUE_MISMATCH] expected=${expectedTransactionValueCents} actual=${transactionValueCents}`,
    );
  }

  const expectedSettlementAmountCents =
    (transactionValueCents * settlementPercentageUnits) / 1_000_000n;

  if (expectedSettlementAmountCents !== settlementAmountCents) {
    throw new Error(
      `[DSI_SETTLEMENT_AMOUNT_MISMATCH] expected=${expectedSettlementAmountCents} actual=${settlementAmountCents}`,
    );
  }
}
