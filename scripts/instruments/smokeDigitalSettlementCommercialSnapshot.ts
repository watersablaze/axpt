import {
  createDigitalSettlementV1Definition,
  INDERAKSH_BUYER_SUBMISSION,
} from "../../src/domains/instruments/definitions/digitalSettlementV1Definition";
import { assertDigitalSettlementCommercialSnapshot } from "../../src/domains/instruments/invariants/digitalSettlementCommercialSnapshot";

function expectFailure(run: () => void, code: string) {
  try {
    run();
  } catch (error) {
    if (error instanceof Error && error.message.includes(code)) {
      return;
    }

    throw error;
  }

  throw new Error(`[DSI_SMOKE_EXPECTED_FAILURE_MISSING] ${code}`);
}

const definition = createDigitalSettlementV1Definition(
  "Verified Legal Counterparty, Ltd.",
);
const snapshot = definition.settlement;

assertDigitalSettlementCommercialSnapshot(snapshot);

if (snapshot.pricingBasis !== "LBMA Gold Price PM less 10%") {
  throw new Error("[DSI_LBMA_PRICING_BASIS_MISMATCH]");
}

if (
  !INDERAKSH_BUYER_SUBMISSION.evidenceBoundary.includes(
    "does not itself establish",
  )
) {
  throw new Error("[DSI_BUYER_SUBMISSION_BOUNDARY_MISSING]");
}

if (!snapshot.settlementPurpose.includes("Transaction Authorization Payment")) {
  throw new Error("[DSI_TAP_PURPOSE_MISSING]");
}

if (
  !snapshot.proceduralBasis.includes("documented export fees") ||
  !snapshot.proceduralBasis.includes("competent authorities") ||
  !snapshot.proceduralBasis.includes("does not substitute")
) {
  throw new Error("[DSI_TAP_EXPORT_AUTHORITY_BOUNDARY_MISSING]");
}

expectFailure(
  () =>
    assertDigitalSettlementCommercialSnapshot({
      ...snapshot,
      spotPricePerKgUsd: "120000.00",
    }),
  "DSI_PENDING_FIXING_HAS_FIXED_VALUES",
);

const fixedSnapshot = {
  ...snapshot,
  pricingStatus: "FIXED",
  spotBenchmark: "Illustrative benchmark at 2026-09-18T00:00:00Z",
  spotPricePerKgUsd: "120000.00",
  pricePerKgUsd: "108000.00",
  transactionValueUsd: "5400000.00",
  settlementAmountUsd: "405000.00",
  priceFixedAt: new Date("2026-09-18T00:00:00.000Z"),
};

assertDigitalSettlementCommercialSnapshot(fixedSnapshot);

expectFailure(
  () =>
    assertDigitalSettlementCommercialSnapshot({
      ...fixedSnapshot,
      pricePerKgUsd: "108000.01",
    }),
  "DSI_PURCHASE_PRICE_MISMATCH",
);

expectFailure(
  () =>
    assertDigitalSettlementCommercialSnapshot({
      ...fixedSnapshot,
      settlementAmountUsd: "405000.01",
    }),
  "DSI_SETTLEMENT_AMOUNT_MISMATCH",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      reference: definition.instrument.reference,
      pricingStatus: snapshot.pricingStatus,
      pricingBasis: snapshot.pricingBasis,
    },
    null,
    2,
  ),
);
