import assert from "node:assert/strict";

import {
  fixDigitalSettlementPricingWithClient,
  type DigitalSettlementPriceFixingClient,
} from "../../src/domains/instruments/commands/fixDigitalSettlementPricingWithClient";

async function main() {
  let update: Record<string, unknown> | null = null;
  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        digitalSettlementInstruction: {
          id: "settlement-1",
          pricingStatus: "PENDING_FIXING",
          pricingBasis: "Gold spot price less 10%",
          spotDiscountPercentage: "10",
          quantityKg: "50",
          settlementPercentage: "7.5",
          principalAuthorizedAt: null,
        },
      }),
    },
    digitalSettlementInstruction: {
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        update = data;
        return { count: 1 };
      },
    },
    domainEvent: {
      create: async () => ({}),
    },
  } as unknown as DigitalSettlementPriceFixingClient;

  const result = await fixDigitalSettlementPricingWithClient({
    client,
    instrumentReference: "FW-DSI-2026-001",
    spotPricePerKgUsd: "120000.00",
    spotBenchmark: "Illustrative benchmark at 2026-09-18T00:00:00Z",
    actorUserId: "operator-1",
    fixedAt: new Date("2026-09-18T00:00:00.000Z"),
  });

  assert.equal(result.fixed, true);
  const capturedUpdate = update as Record<string, unknown> | null;
  assert.ok(capturedUpdate);
  assert.equal(capturedUpdate.pricePerKgUsd, "108000.00");
  assert.equal(capturedUpdate.transactionValueUsd, "5400000.00");
  assert.equal(capturedUpdate.settlementAmountUsd, "405000.00");

  console.log("DIGITAL_SETTLEMENT_PRICE_FIXING_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
