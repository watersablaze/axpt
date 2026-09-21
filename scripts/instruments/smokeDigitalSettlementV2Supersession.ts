import assert from "node:assert/strict";

import {
  supersedeDigitalSettlementWithV2FinancierRevisionWithClient,
  type DigitalSettlementV2SupersessionClient,
} from "../../src/domains/instruments/commands/supersedeDigitalSettlementWithV2FinancierRevisionWithClient";

async function main() {
  let currentVersion = 1;
  let v1Status = "ISSUED";
  let v1SupersededAt: Date | null = null;

  let v2: {
    id: string;
    number: number;
    status: string;
    issuedAt: Date;
  } | null = null;

  const events: Array<{
    eventType: string;
    payload: Record<string, unknown>;
  }> = [];

  const settlement = {
    quantityKg: { toString: () => "50" },
    pricingStatus: "FIXED",
    spotDiscountPercentage: { toString: () => "10" },
    spotBenchmark:
      "LBMA Gold Price PM · 2026-09-18 · USD 4,348.15 per troy ounce",
    spotPricePerKgUsd: { toString: () => "139796.27" },
    pricePerKgUsd: { toString: () => "125816.64" },
    transactionValueUsd: { toString: () => "6290832.00" },
    settlementPercentage: { toString: () => "7.5" },
    settlementAmountUsd: { toString: () => "471812.40" },
    priceFixedAt: new Date("2026-09-18T12:00:00.000Z"),

    settlementStatus: "AWAITING_VERIFICATION_TRANSFER",
    verificationAmountUsdt: { toString: () => "50" },

    verificationTxHash: null,
    verificationConfirmedAt: null,
    principalAuthorizedAt: null,
  };

  const originalSettlementSnapshot = {
    settlementStatus: settlement.settlementStatus,
    verificationAmountUsdt:
      settlement.verificationAmountUsdt.toString(),
    settlementAmountUsd:
      settlement.settlementAmountUsd.toString(),
    verificationTxHash: settlement.verificationTxHash,
    verificationConfirmedAt:
      settlement.verificationConfirmedAt,
    principalAuthorizedAt:
      settlement.principalAuthorizedAt,
  };

  const client = {
    institutionalInstrument: {
      findUnique: async () => ({
        id: "instrument-1",
        reference: "FW-DSI-2026-001",
        status: "ISSUED",
        currentVersion,

        versions: [
          {
            id: "version-1",
            number: 1,
            status: v1Status,
            issuedAt: new Date(
              "2026-09-20T18:39:17.000Z",
            ),
            supersededAt: v1SupersededAt,
          },
          ...(v2 ? [v2] : []),
        ],

        digitalSettlementInstruction: settlement,
      }),

      update: async ({
        data,
      }: {
        data: {
          currentVersion: number;
        };
      }) => {
        currentVersion = data.currentVersion;

        return {
          id: "instrument-1",
          currentVersion,
        };
      },
    },

    instrumentVersion: {
      create: async ({
        data,
      }: {
        data: {
          instrumentId: string;
          number: number;
          status: string;
          createdByUserId: string;
          issuedAt: Date;
        };
      }) => {
        v2 = {
          id: "version-2",
          number: data.number,
          status: data.status,
          issuedAt: data.issuedAt,
        };

        return v2;
      },

      update: async ({
        data,
      }: {
        data: {
          status: string;
          supersededAt: Date;
        };
      }) => {
        v1Status = data.status;
        v1SupersededAt = data.supersededAt;

        return {
          id: "version-1",
          status: v1Status,
          supersededAt: v1SupersededAt,
        };
      },
    },

    domainEvent: {
      createMany: async ({
        data,
      }: {
        data: Array<{
          eventType: string;
          payload: Record<string, unknown>;
        }>;
      }) => {
        events.push(...data);

        return {
          count: data.length,
        };
      },
    },
  } as unknown as DigitalSettlementV2SupersessionClient;

  const first =
    await supersedeDigitalSettlementWithV2FinancierRevisionWithClient({
      client,
      instrumentReference: "FW-DSI-2026-001",
      actorUserId: "operator-1",
    });

  assert.equal(first.transitioned, true);
  assert.equal(first.previousVersionNumber, 1);
  assert.equal(first.versionNumber, 2);

  assert.equal(currentVersion, 2);
  assert.equal(v1Status, "SUPERSEDED");
  assert.ok(v1SupersededAt);

  const createdV2 = v2 as {
    id: string;
    number: number;
    status: string;
    issuedAt: Date;
  } | null;

  assert.ok(createdV2);
  assert.equal(createdV2.number, 2);
  assert.equal(createdV2.status, "ISSUED");

  assert.deepEqual(
    events.map((event) => event.eventType),
    [
      "INSTRUMENT_VERSION_CREATED",
      "INSTRUMENT_VERSION_SUPERSEDED",
      "INSTRUMENT_VERSION_ISSUED",
    ],
  );

  assert.deepEqual(
    {
      settlementStatus: settlement.settlementStatus,
      verificationAmountUsdt:
        settlement.verificationAmountUsdt.toString(),
      settlementAmountUsd:
        settlement.settlementAmountUsd.toString(),
      verificationTxHash: settlement.verificationTxHash,
      verificationConfirmedAt:
        settlement.verificationConfirmedAt,
      principalAuthorizedAt:
        settlement.principalAuthorizedAt,
    },
    originalSettlementSnapshot,
  );

  const eventCountAfterFirstRun = events.length;

  const retry =
    await supersedeDigitalSettlementWithV2FinancierRevisionWithClient({
      client,
      instrumentReference: "FW-DSI-2026-001",
      actorUserId: "operator-1",
    });

  assert.equal(retry.transitioned, false);
  assert.equal(retry.versionNumber, 2);
  assert.equal(events.length, eventCountAfterFirstRun);

  console.log(
    "DIGITAL_SETTLEMENT_V2_SUPERSESSION_OK",
  );
  console.log(
    "V1_SUPERSEDED_V2_ISSUED_OK",
  );
  console.log(
    "SETTLEMENT_STATE_PRESERVED_OK",
  );
  console.log(
    "SUPERSESSION_RETRY_IDEMPOTENT_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
