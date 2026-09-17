import assert from "node:assert/strict";

import {
  authorizeDigitalSettlementPrincipalWithClient,
  type DigitalSettlementPrincipalAuthorizationClient,
} from "../../src/domains/instruments/commands/authorizeDigitalSettlementPrincipalWithClient";
import {
  confirmDigitalSettlementVerificationWithClient,
  type DigitalSettlementVerificationClient,
} from "../../src/domains/instruments/commands/confirmDigitalSettlementVerificationWithClient";
import { DIGITAL_SETTLEMENT_STATUS } from "../../src/domains/instruments/contracts";

const TRANSACTION_HASH = `0x${"ab".repeat(32)}`;

async function main() {
  let verificationUpdate: Record<string, unknown> | null = null;
  const verificationClient = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        status: "ISSUED",
        digitalSettlementInstruction: {
          id: "settlement-1",
          settlementStatus:
            DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER,
          verificationTxHash: null,
          verificationAmountUsdt: "50",
          receivingAddress: "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",
        },
      }),
    },
    digitalSettlementInstruction: {
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        verificationUpdate = data;
        return { count: 1 };
      },
    },
    domainEvent: {
      create: async () => ({}),
    },
  } as unknown as DigitalSettlementVerificationClient;

  await assert.rejects(
    () =>
      confirmDigitalSettlementVerificationWithClient({
        client: verificationClient,
        instrumentReference: "FW-DSI-2026-001",
        transactionHash: TRANSACTION_HASH,
        observedAmountUsdt: "49",
        observedReceivingAddress: "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",
        actorUserId: "operator-1",
      }),
    /DSI_VERIFICATION_AMOUNT_MISMATCH/,
  );

  await assert.rejects(
    () =>
      confirmDigitalSettlementVerificationWithClient({
        client: verificationClient,
        instrumentReference: "FW-DSI-2026-001",
        transactionHash: TRANSACTION_HASH,
        observedAmountUsdt: "50",
        observedReceivingAddress: "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F",
        actorUserId: "operator-1",
      }),
    /DSI_VERIFICATION_RECEIVING_ADDRESS_MISMATCH/,
  );

  const verification = await confirmDigitalSettlementVerificationWithClient({
    client: verificationClient,
    instrumentReference: "FW-DSI-2026-001",
    transactionHash: TRANSACTION_HASH,
    observedAmountUsdt: "50",
    observedReceivingAddress: "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",
    actorUserId: "operator-1",
    verifiedAt: new Date("2026-09-17T01:00:00.000Z"),
  });

  const capturedVerificationUpdate = verificationUpdate as Record<
    string,
    unknown
  > | null;
  assert.ok(capturedVerificationUpdate);
  assert.equal(verification.confirmed, true);
  assert.equal(
    capturedVerificationUpdate.settlementStatus,
    DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED,
  );

  let authorizationUpdate: Record<string, unknown> | null = null;
  const authorizationClient = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        status: "ISSUED",
        digitalSettlementInstruction: {
          id: "settlement-1",
          settlementStatus: DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED,
          verificationTxHash: TRANSACTION_HASH,
          verificationConfirmedAt: new Date("2026-09-17T01:00:00.000Z"),
          principalAuthorizedAt: null,
        },
      }),
    },
    digitalSettlementInstruction: {
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        authorizationUpdate = data;
        return { count: 1 };
      },
    },
    domainEvent: {
      create: async () => ({}),
    },
  } as unknown as DigitalSettlementPrincipalAuthorizationClient;

  const authorization = await authorizeDigitalSettlementPrincipalWithClient({
    client: authorizationClient,
    instrumentReference: "FW-DSI-2026-001",
    actorUserId: "operator-1",
    authorizedAt: new Date("2026-09-17T01:05:00.000Z"),
  });

  const capturedAuthorizationUpdate = authorizationUpdate as Record<
    string,
    unknown
  > | null;
  assert.ok(capturedAuthorizationUpdate);
  assert.equal(authorization.authorized, true);
  assert.equal(
    capturedAuthorizationUpdate.settlementStatus,
    DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER,
  );

  console.log("DIGITAL_SETTLEMENT_TRANSFER_AUTHORITY_OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
