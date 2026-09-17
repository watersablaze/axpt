import { createHinesDigitalSettlementV1Definition } from "../../src/domains/instruments/definitions/hinesDigitalSettlementV1Definition";
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

const definition = createHinesDigitalSettlementV1Definition(
  "Verified Legal Counterparty, Ltd.",
);
const snapshot = definition.settlement;

assertDigitalSettlementCommercialSnapshot(snapshot);

expectFailure(
  () =>
    assertDigitalSettlementCommercialSnapshot({
      ...snapshot,
      transactionValueUsd: "5500001",
    }),
  "DSI_TRANSACTION_VALUE_MISMATCH",
);

expectFailure(
  () =>
    assertDigitalSettlementCommercialSnapshot({
      ...snapshot,
      settlementAmountUsd: "412501",
    }),
  "DSI_SETTLEMENT_AMOUNT_MISMATCH",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      reference: definition.instrument.reference,
      transactionValueUsd: snapshot.transactionValueUsd,
      settlementAmountUsd: snapshot.settlementAmountUsd,
    },
    null,
    2,
  ),
);
