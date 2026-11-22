import assert from "node:assert/strict";

import { hashInstrumentAccessToken } from "../../src/domains/instruments/access/accessToken";
import {
  issueDigitalSettlementV2AccessGrantsWithClient,
  type DigitalSettlementV2AccessGrantIssuanceClient,
} from "../../src/domains/instruments/commands/issueDigitalSettlementV2AccessGrantsWithClient";

async function main() {
  const storedGrants: Array<{
    id: string;
    instrumentVersionId: string | null;
    recipientName: string | null;
    recipientRole: string;
    accessLevel: string;
    codeHash: string;
    expiresAt: Date | null;
  }> = [];

  const events: Array<{
    eventType: string;
    payload?: Record<string, unknown>;
  }> = [];

  let grantSequence = 0;

  const client = {
    institutionalInstrument: {
      findUnique: async ({
        select,
      }: {
        select?: Record<string, boolean>;
      }) => {
        if (
          select &&
          "currentVersion" in select
        ) {
          return {
            id: "instrument-1",
            status: "ISSUED",
            currentVersion: 2,
          };
        }

        return {
          id: "instrument-1",
          reference: "FW-DSI-2026-001",
        };
      },
    },

    instrumentVersion: {
      findUnique: async () => ({
        id: "version-2",
        number: 2,
        status: "ISSUED",
      }),
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
            (data.recipientName as string | null) ?? null,
          recipientRole:
            data.recipientRole as string,
          accessLevel:
            data.accessLevel as string,
          codeHash:
            data.codeHash as string,
          expiresAt:
            (data.expiresAt as Date | null) ?? null,
        };

        storedGrants.push(grant);

        return {
          id: grant.id,
          instrumentVersionId:
            grant.instrumentVersionId,
          recipientName:
            grant.recipientName,
          accessLevel:
            grant.accessLevel,
          expiresAt:
            grant.expiresAt,
        };
      },
    },

    domainEvent: {
      create: async ({
        data,
      }: {
        data: {
          eventType: string;
          payload?: Record<string, unknown>;
        };
      }) => {
        events.push({
          eventType: data.eventType,
          payload: data.payload,
        });

        return {};
      },
    },
  } as unknown as DigitalSettlementV2AccessGrantIssuanceClient;

  const issued =
    await issueDigitalSettlementV2AccessGrantsWithClient({
      client,
      instrumentReference: "FW-DSI-2026-001",
      issuedByUserId: "operator-1",
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
    });

  assert.equal(issued.length, 5);
  assert.equal(storedGrants.length, 5);
  assert.equal(events.length, 5);

  assert.deepEqual(
    issued.map((entry) => entry.key),
    [
      "financier",
      "buyerRepresentative",
      "externalReviewer",
      "bobby",
      "lawrence",
    ],
  );

  for (let index = 0; index < issued.length; index += 1) {
    const result = issued[index];
    const stored = storedGrants[index];

    assert.ok(result);
    assert.ok(stored);

    assert.equal(
      result.instrumentVersion.id,
      "version-2",
    );
    assert.equal(
      result.instrumentVersion.number,
      2,
    );
    assert.equal(
      result.grant.instrumentVersionId,
      "version-2",
    );
    assert.equal(
      stored.instrumentVersionId,
      "version-2",
    );

    assert.equal(
      stored.accessLevel,
      "VIEW",
    );

    assert.equal(
      stored.codeHash,
      hashInstrumentAccessToken(result.token),
    );

    assert.notEqual(
      stored.codeHash,
      result.token,
    );

    assert.equal(
      events[index]?.eventType,
      "INSTRUMENT_ACCESS_GRANTED",
    );

    assert.equal(
      events[index]?.payload?.instrumentVersionId,
      "version-2",
    );

    assert.equal(
      events[index]?.payload?.instrumentVersionNumber,
      2,
    );
  }

  const rawTokens = issued.map(
    (entry) => entry.token,
  );

  assert.equal(
    new Set(rawTokens).size,
    5,
  );

  const financier = issued.find(
    (entry) => entry.key === "financier",
  );

  assert.ok(financier);
  assert.equal(
    financier.recipientName,
    "Carl Albert Meisterlin",
  );
  assert.equal(
    financier.authorizedAmountUsdt,
    "50",
  );

  const nonFinanciers = issued.filter(
    (entry) => entry.key !== "financier",
  );

  assert.equal(nonFinanciers.length, 4);

  for (const entry of nonFinanciers) {
    assert.equal(
      entry.authorizedAmountUsdt,
      null,
    );
  }

  console.log(
    "DIGITAL_SETTLEMENT_V2_ACCESS_GRANT_ISSUANCE_OK",
  );
  console.log(
    "FIVE_DISTINCT_VERSION_BOUND_GRANTS_OK",
  );
  console.log(
    "RAW_TOKENS_EPHEMERAL_HASHES_PERSISTED_OK",
  );
  console.log(
    "FIVE_ACCESS_GRANTED_EVENTS_OK",
  );
  console.log(
    "NO_COMMUNICATION_SIDE_EFFECTS_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
