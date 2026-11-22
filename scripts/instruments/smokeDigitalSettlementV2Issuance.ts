import assert from "node:assert/strict";

import {
  issueDigitalSettlementV2FinancierRevisionWithClient,
  type DigitalSettlementV2FinancierRevisionIssuanceClient,
} from "../../src/domains/instruments/commands/issueDigitalSettlementV2FinancierRevisionWithClient";

async function main() {
  let currentVersion = 1;

  let v1Status = "ISSUED";
  let v1SupersededAt: Date | null = null;

  let v2:
    | {
        id: string;
        number: number;
        status: string;
        issuedAt: Date;
      }
    | null = null;

  const grants: Array<{
    id: string;
    instrumentVersionId: string | null;
    recipientName: string | null;
    accessLevel: string;
    expiresAt: Date | null;
  }> = [];

  const events: string[] = [];

  const settlement = {
    quantityKg: { toString: () => "50" },
    pricingStatus: "FIXED",
    spotDiscountPercentage: {
      toString: () => "10",
    },
    spotBenchmark:
      "LBMA Gold Price PM · 2026-09-18 · USD 4,348.15 per troy ounce",
    spotPricePerKgUsd: {
      toString: () => "139796.27",
    },
    pricePerKgUsd: {
      toString: () => "125816.64",
    },
    transactionValueUsd: {
      toString: () => "6290832.00",
    },
    settlementPercentage: {
      toString: () => "7.5",
    },
    settlementAmountUsd: {
      toString: () => "471812.40",
    },
    priceFixedAt:
      new Date("2026-09-18T12:00:00.000Z"),

    settlementStatus:
      "AWAITING_VERIFICATION_TRANSFER",

    verificationAmountUsdt: {
      toString: () => "50",
    },

    verificationTxHash: null,
    verificationConfirmedAt: null,
    principalAuthorizedAt: null,
  };

  let grantSequence = 0;

  const client = {
    institutionalInstrument: {
      findUnique: async ({
        include,
        select,
      }: {
        include?: Record<string, boolean>;
        select?: Record<string, boolean>;
      }) => {
        if (include) {
          return {
            id: "instrument-1",
            reference: "FW-DSI-2026-001",
            status: "ISSUED",
            currentVersion,
            versions: [
              {
                id: "version-1",
                number: 1,
                status: v1Status,
                issuedAt:
                  new Date(
                    "2026-09-20T18:39:17.000Z",
                  ),
                supersededAt:
                  v1SupersededAt,
              },
              ...(v2 ? [v2] : []),
            ],
            digitalSettlementInstruction:
              settlement,
          };
        }

        if (
          select &&
          "currentVersion" in select
        ) {
          return {
            id: "instrument-1",
            status: "ISSUED",
            currentVersion,
          };
        }

        return {
          id: "instrument-1",
          reference: "FW-DSI-2026-001",
        };
      },

      update: async ({
        data,
      }: {
        data: {
          currentVersion: number;
        };
      }) => {
        currentVersion =
          data.currentVersion;

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
          number: number;
          status: string;
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
        v1SupersededAt =
          data.supersededAt;

        return {
          id: "version-1",
          status: v1Status,
          supersededAt:
            v1SupersededAt,
        };
      },

      findUnique: async () => {
        if (!v2) {
          return null;
        }

        return {
          id: "version-2",
          number: 2,
          status: "ISSUED",
        };
      },
    },

    instrumentAccessGrant: {
      create: async ({
        data,
      }: {
        data: Record<string, unknown>;
      }) => {
        grantSequence += 1;

        const grant = {
          id: `grant-${grantSequence}`,
          instrumentVersionId:
            (data.instrumentVersionId as string | null) ??
            null,
          recipientName:
            (data.recipientName as string | null) ??
            null,
          accessLevel:
            data.accessLevel as string,
          expiresAt:
            (data.expiresAt as Date | null) ??
            null,
        };

        grants.push(grant);

        return grant;
      },
    },

    domainEvent: {
      create: async ({
        data,
      }: {
        data: {
          eventType: string;
        };
      }) => {
        events.push(data.eventType);
        return {};
      },

      createMany: async ({
        data,
      }: {
        data: Array<{
          eventType: string;
        }>;
      }) => {
        events.push(
          ...data.map(
            (event) =>
              event.eventType,
          ),
        );

        return {
          count: data.length,
        };
      },
    },
  } as unknown as DigitalSettlementV2FinancierRevisionIssuanceClient;

  const issued =
    await issueDigitalSettlementV2FinancierRevisionWithClient({
      client,
      instrumentReference:
        "FW-DSI-2026-001",
      actorUserId:
        "operator-1",
      accessExpiresAt:
        new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000,
        ),
    });

  assert.equal(
    issued.supersession.transitioned,
    true,
  );

  assert.equal(
    currentVersion,
    2,
  );

  assert.equal(
    v1Status,
    "SUPERSEDED",
  );

  assert.equal(
    issued.grants.length,
    5,
  );

  assert.equal(
    grants.length,
    5,
  );

  for (const grant of grants) {
    assert.equal(
      grant.instrumentVersionId,
      "version-2",
    );

    assert.equal(
      grant.accessLevel,
      "VIEW",
    );
  }

  assert.equal(
    events.filter(
      (event) =>
        event ===
        "INSTRUMENT_VERSION_CREATED",
    ).length,
    1,
  );

  assert.equal(
    events.filter(
      (event) =>
        event ===
        "INSTRUMENT_VERSION_SUPERSEDED",
    ).length,
    1,
  );

  assert.equal(
    events.filter(
      (event) =>
        event ===
        "INSTRUMENT_VERSION_ISSUED",
    ).length,
    1,
  );

  assert.equal(
    events.filter(
      (event) =>
        event ===
        "INSTRUMENT_ACCESS_GRANTED",
    ).length,
    5,
  );

  await assert.rejects(
    () =>
      issueDigitalSettlementV2FinancierRevisionWithClient({
        client,
        instrumentReference:
          "FW-DSI-2026-001",
        actorUserId:
          "operator-1",
        accessExpiresAt:
          new Date(
            Date.now() +
              7 * 24 * 60 * 60 * 1000,
          ),
      }),
    /DSI_V2_ISSUANCE_ALREADY_COMPLETED/,
  );

  assert.equal(
    grants.length,
    5,
  );

  console.log(
    "DIGITAL_SETTLEMENT_V2_ATOMIC_ISSUANCE_OK",
  );

  console.log(
    "V1_SUPERSESSION_AND_FIVE_GRANTS_COMPOSED_OK",
  );

  console.log(
    "V2_RETRY_DOES_NOT_DUPLICATE_GRANTS_OK",
  );

  console.log(
    "NO_EXTERNAL_DELIVERY_IN_DATABASE_COMMAND_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
