import assert from "node:assert/strict";

import {
  issueDigitalSettlementInstructionWithClient,
  type DigitalSettlementIssuanceClient,
} from "../../src/domains/instruments/commands/issueDigitalSettlementInstructionWithClient";
import { DIGITAL_SETTLEMENT_STATUS } from "../../src/domains/instruments/contracts";
import { resolveAuthorizedSettlementIngress } from "../../src/domains/instruments/digital-settlement/resolveAuthorizedSettlementIngress";

const OPERATIONS_ADDRESS = "0x40143ECEF96EC52365c6E3164dE891C62c9A012E";
const TREASURY_ADDRESS = "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F";

async function main() {
  const ingress = resolveAuthorizedSettlementIngress(OPERATIONS_ADDRESS);
  assert.equal(ingress.id, "axpt-operations");
  assert.equal(ingress.role, "operations");

  assert.throws(
    () => resolveAuthorizedSettlementIngress(TREASURY_ADDRESS),
    /DSI_ISSUANCE_INVALID_RECEIVING_WALLET_ROLE/,
  );
  assert.throws(
    () =>
      resolveAuthorizedSettlementIngress(
        "0x0000000000000000000000000000000000000001",
      ),
    /DSI_ISSUANCE_UNREGISTERED_RECEIVING_WALLET/,
  );

  let settlementUpdate: Record<string, unknown> | null = null;
  const events: Array<Record<string, unknown>> = [];

  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        status: "DRAFT",
        currentVersion: 1,
        versions: [{ id: "version-1", number: 1, status: "DRAFT" }],
        digitalSettlementInstruction: {
          id: "settlement-1",
          publicId: "fw-dsi-2026-001",
          pricingStatus: "FIXED",
          spotBenchmark: "Approved benchmark",
          spotPricePerKgUsd: "140437.68",
          pricePerKgUsd: "126393.91",
          transactionValueUsd: "6319695.50",
          settlementAmountUsd: "473977.16",
          priceFixedAt: new Date("2026-09-17T15:00:00.000Z"),
          receivingAddress: null,
        },
      }),
      update: async () => ({}),
    },
    instrumentVersion: {
      update: async () => ({}),
    },
    digitalSettlementInstruction: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        settlementUpdate = data;
        return {};
      },
    },
    domainEvent: {
      createMany: async ({
        data,
      }: {
        data: Array<Record<string, unknown>>;
      }) => {
        events.push(...data);
        return { count: data.length };
      },
    },
  } as unknown as DigitalSettlementIssuanceClient;

  const unpricedClient = {
    ...client,
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-unpriced",
        status: "DRAFT",
        currentVersion: 1,
        versions: [{ id: "version-unpriced", number: 1, status: "DRAFT" }],
        digitalSettlementInstruction: {
          id: "settlement-unpriced",
          publicId: "fw-dsi-unpriced",
          pricingStatus: "PENDING_FIXING",
          spotBenchmark: null,
          spotPricePerKgUsd: null,
          pricePerKgUsd: null,
          transactionValueUsd: null,
          settlementAmountUsd: null,
          priceFixedAt: null,
          receivingAddress: null,
        },
      }),
    },
  } as unknown as DigitalSettlementIssuanceClient;

  await assert.rejects(
    () =>
      issueDigitalSettlementInstructionWithClient({
        client: unpricedClient,
        instrumentReference: "FW-DSI-UNPRICED",
        receivingAddress: OPERATIONS_ADDRESS,
        actorUserId: "operator-1",
      }),
    /DSI_ISSUANCE_PRICE_FIXING_REQUIRED/,
  );

  const result = await issueDigitalSettlementInstructionWithClient({
    client,
    instrumentReference: "FW-DSI-2026-001",
    receivingAddress: OPERATIONS_ADDRESS,
    actorUserId: "operator-1",
  });

  const capturedSettlementUpdate = settlementUpdate as Record<
    string,
    unknown
  > | null;
  assert.ok(capturedSettlementUpdate);
  assert.equal(result.receivingWalletId, "axpt-operations");
  assert.equal(capturedSettlementUpdate.receivingWalletId, "axpt-operations");
  assert.equal(capturedSettlementUpdate.receivingWalletRole, "operations");
  assert.equal(
    capturedSettlementUpdate.settlementStatus,
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
  );
  assert.equal(events.length, 3);

  console.log("DIGITAL_SETTLEMENT_INGRESS_POLICY_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
