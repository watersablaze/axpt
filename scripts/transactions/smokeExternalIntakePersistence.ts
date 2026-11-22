import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  registerExternalIntakeWithClient,
} from "../../src/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

const evidenceBytes = Buffer.from(
  "FW-TXN-1B-TEST-EVIDENCE-NOT-LIVE",
);

const evidenceHash = createHash("sha256")
  .update(evidenceBytes)
  .digest("hex");

const input = {
  operationalReference: "FW-TXN-2026-001-TEST",
  operatorUserId: "operator-test",
  source: "EXTERNAL_EMAIL" as const,
  sourceEvidenceReference: "test-custody/zkkm/loi",
  sourceEvidenceSha256: evidenceHash,
  evidenceBytes,
  submitterName: "Enver Gonuler",
  submitterEmail: "enver@synkhem.com",
  submitterRole: "INTERMEDIARY_UNVERIFIED",
  buyerName: "ZKKM BULLION TRADING - FZCO",
  commodity: "Gold Doré",
  trialQuantity: "50 kg",
  monthlyQuantity: "50-100 kg",
  destination: "United Arab Emirates",
  originatingCandidateName: "Mark",
  deliveryTerms: "Dubai refinery; proposed, not accepted",
  settlementMethod: "USD bank transfer; unverified",
};

type Intake = Record<string, any>;
type Event = Record<string, any>;

const state: {
  intakes: Intake[];
  events: Event[];
  failEvent: boolean;
  admin: boolean;
} = {
  intakes: [],
  events: [],
  failEvent: false,
  admin: true,
};

const db = {
  async $transaction(callback: (tx: any) => Promise<any>) {
    const intakes = structuredClone(state.intakes);
    const events = structuredClone(state.events);

    const tx = {
      user: {
        findUnique: async () =>
          state.admin
            ? {
                id: "operator-test",
                email: "operator@example.test",
                isAdmin: true,
              }
            : null,
      },
      transactionIntake: {
        findUnique: async ({ where }: any) =>
          intakes.find((x) => x.reference === where.reference) ??
          null,
        create: async ({ data }: any) => {
          const created = {
            ...data,
            id: `test-intake-${intakes.length + 1}`,
          };
          intakes.push(created);
          return created;
        },
      },
      transactionIntakeEvent: {
        findFirst: async ({ where }: any) =>
          events.find(
            (x) =>
              x.intakeId === where.intakeId &&
              x.eventType === where.eventType,
          ) ?? null,
        create: async ({ data }: any) => {
          if (state.failEvent) {
            throw new Error("TEST_EVENT_FAILURE");
          }
          events.push(data);
          return data;
        },
      },
    };

    const result = await callback(tx);

    state.intakes = intakes;
    state.events = events;

    return result;
  },
};

async function main() {
  const client = db as any;

  const first = await registerExternalIntakeWithClient(
    client,
    input,
  );

  assert.equal(first.alreadyRegistered, false);
  assert.equal(state.intakes.length, 1);
  assert.equal(state.events.length, 1);
  assert.equal(state.intakes[0].referredByName, "Mark");
  assert.equal(state.intakes[0].referralConfirmed, false);
  assert.equal(state.intakes[0].authorityToSign, false);

  const replay = await registerExternalIntakeWithClient(
    client,
    input,
  );

  assert.equal(replay.alreadyRegistered, true);
  assert.equal(replay.intakeId, first.intakeId);
  assert.equal(state.intakes.length, 1);
  assert.equal(state.events.length, 1);

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      buyerName: "DIFFERENT BUYER",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      sourceEvidenceSha256: "0".repeat(64),
    }),
    /FW_TXN_EVIDENCE_HASH_MISMATCH/,
  );

  const changedEvidenceBytes = Buffer.from(
    "FW-TXN-1B-DIFFERENT-SOURCE-EVIDENCE",
  );

  const changedEvidenceHash = createHash("sha256")
    .update(changedEvidenceBytes)
    .digest("hex");

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      evidenceBytes: changedEvidenceBytes,
      sourceEvidenceSha256: changedEvidenceHash,
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  assert.equal(state.intakes.length, 1);
  assert.equal(state.events.length, 1);

  assert.match(
    first.intakeReference,
    /^AXPT-INT-EXT-[A-F0-9]{32}$/,
  );

  // Identical evidence with altered commercial declarations
  // must never be accepted as an identical retry.
  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      settlementMethod: "CASH AFTER REFINERY ASSAY",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      trialQuantity: "100 kg",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      submitterRole: "AUTHORIZED_BUYER_MANDATE",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  assert.equal(state.intakes.length, 1);
  assert.equal(state.events.length, 1);

  const provenance = JSON.parse(state.events[0].note);

  assert.equal(provenance.version, 1);
  assert.match(
    provenance.requestFingerprint,
    /^[a-f0-9]{64}$/,
  );
  assert.equal(provenance.originator, "Mark");
  assert.equal(provenance.introductionChannelName, undefined);

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      introductionChannelName: "Enver Gonuler",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  assert.equal(state.intakes.length, 1);
  assert.equal(state.events.length, 1);

  const introducedInput = {
    ...input,
    operationalReference: "FW-TXN-ZKKM-CHAIN-TEST",
    introductionChannelName: "Enver Gonuler",
  };

  const introduced = await registerExternalIntakeWithClient(
    client,
    introducedInput,
  );

  assert.equal(introduced.alreadyRegistered, false);
  assert.equal(state.intakes.length, 2);
  assert.equal(state.events.length, 2);
  assert.equal(state.intakes[1].referredByName, "Mark");
  assert.equal(state.intakes[1].referralConfirmed, false);
  assert.equal(state.intakes[1].authorityToRepresent, false);
  assert.equal(state.intakes[1].authorityToNegotiate, false);
  assert.equal(state.intakes[1].authorityToSign, false);

  const chainProvenance = JSON.parse(state.events[1].note);

  assert.equal(chainProvenance.version, 2);
  assert.equal(chainProvenance.originator, "Mark");
  assert.equal(
    chainProvenance.introductionChannelName,
    "Enver Gonuler",
  );
  assert.equal(
    chainProvenance.operationalReference,
    introducedInput.operationalReference,
  );
  assert.match(
    chainProvenance.requestFingerprint,
    /^[a-f0-9]{64}$/,
  );

  const repeatedIntroduction =
    await registerExternalIntakeWithClient(
      client,
      introducedInput,
    );

  assert.equal(repeatedIntroduction.alreadyRegistered, true);
  assert.equal(repeatedIntroduction.intakeId, introduced.intakeId);
  assert.equal(state.intakes.length, 2);
  assert.equal(state.events.length, 2);

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...introducedInput,
      introductionChannelName: "Different Intermediary",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  const { introductionChannelName: omitted, ...withoutChannel } =
    introducedInput;

  await assert.rejects(
    registerExternalIntakeWithClient(client, withoutChannel),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  assert.equal(state.intakes.length, 2);
  assert.equal(state.events.length, 2);

  console.log(
    "PASS: legacy registration remains immutable",
  );
  console.log(
    "PASS: introduction chain persisted and replay is idempotent",
  );
  console.log(
    "PASS: changed or removed intermediary rejected",
  );

  state.admin = false;

  await assert.rejects(
    registerExternalIntakeWithClient(client, input),
    /FW_TXN_OPERATOR_UNAUTHORIZED/,
  );

  state.admin = true;
  state.failEvent = true;

  const before = state.intakes.length;

  await assert.rejects(
    registerExternalIntakeWithClient(client, {
      ...input,
      operationalReference: "FW-TXN-ROLLBACK-TEST",
    }),
    /TEST_EVENT_FAILURE/,
  );

  assert.equal(state.intakes.length, before);

  console.log(
    "PASS: FW-TXN-1B.1 transactional registration contract",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
