import assert from "node:assert/strict";

import {
  issueFrenchWardInstitutionalInvitationWithClient as issue,
} from "../../src/domains/institutions/french-ward/participants/invitations/issueFrenchWardInstitutionalInvitationWithClient";

type Row = Record<string, any>;

function fixture(options: {
  authorized?: boolean;
  failClaim?: boolean;
} = {}) {
  let durable = {
    invitations: [] as Row[],
    deliveries: [] as Row[],
    events: [] as Row[],
  };

  let sequence = 0;

  const client = {
    async $transaction(callback: (tx: any) => Promise<any>) {
      const draft = structuredClone(durable);

      const tx = {
        user: {
          async findUnique() {
            return {
              id: "issuer-1",
              isAdmin: options.authorized !== false,
            };
          },
        },

        frenchWardInstitutionalInvitation: {
          async findUnique(args: any) {
            return draft.invitations.find(
              row => row.reference === args.where.reference,
            ) ?? null;
          },

          async findFirst(args: any) {
            return draft.invitations.find(row =>
              row.participantReference ===
                args.where.participantReference &&
              row.acceptedAt === null &&
              row.revokedAt === null &&
              row.expiresAt > args.where.expiresAt.gt
            ) ?? null;
          },

          async create(args: any) {
            const data = args.data;

            if (draft.invitations.some(
              row => row.reference === data.reference,
            )) {
              throw new Error("UNIQUE_INVITATION_REFERENCE");
            }

            const row = {
              ...data,
              id: `inv-${++sequence}`,
              acceptedAt: null,
              revokedAt: null,
            };

            draft.invitations.push(row);
            return row;
          },
        },

        frenchWardInstitutionalInvitationDelivery: {
          async create(args: any) {
            if (options.failClaim) {
              throw new Error("SIMULATED_DELIVERY_CLAIM_FAILURE");
            }

            const data = args.data;

            if (draft.deliveries.some(row =>
              row.deliveryKey === data.deliveryKey ||
              row.invitationId === data.invitationId
            )) {
              throw new Error("UNIQUE_DELIVERY_CLAIM");
            }

            draft.deliveries.push({
              ...data,
              id: `delivery-${draft.deliveries.length + 1}`,
            });
          },
        },

        domainEvent: {
          async create(args: any) {
            draft.events.push(args.data);
          },
        },
      };

      const result = await callback(tx);
      durable = draft;
      return result;
    },
  };

  return {
    client: client as any,
    snapshot: () => structuredClone(durable),
  };
}

const now = new Date("2026-11-12T18:00:00.000Z");

function input(
  reference: string,
  deliveryKey?: string,
) {
  return {
    reference,
    recipientEmail: "recipient@example.test",
    recipientDisplayName: "Test Recipient",
    participantReference: `FW-PART-${reference}`,
    institutionalTitle: "Proposed Institutional Participant",
    capacityClass: "STRATEGIC" as const,
    recognitionBasis: "TEST_ONLY_NO_PRODUCTION_AUTHORITY",
    expiresAt: new Date("2026-12-12T18:00:00.000Z"),
    issuedByUserId: "issuer-1",
    now,
    ...(deliveryKey ? { deliveryKey } : {}),
  };
}

async function main() {
const key = "TEST_DELIVERY_KEY_00000001";

{
  const f = fixture();

  const result = await issue({
    client: f.client,
    input: input("FW-TEST-ATOMIC-1", key),
  });

  const state = f.snapshot();

  assert.equal(state.invitations.length, 1);
  assert.equal(state.deliveries.length, 1);
  assert.equal(state.events.length, 1);
  assert.equal(state.deliveries[0].status, "SENDING");
  assert.equal(
    state.deliveries[0].invitationId,
    state.invitations[0].id,
  );

  assert.match(result.credential, /^[A-Za-z0-9_-]{43}$/);

  const durableText = JSON.stringify(state);

  assert.ok(!durableText.includes(result.credential));
  assert.ok(!durableText.includes(
    "/french-ward/institutional/access/",
  ));

  console.log("atomic_invitation_claim_event=PASS");
  console.log("bearer_absent_from_durable_records=PASS");

  await assert.rejects(
    issue({
      client: f.client,
      input: input("FW-TEST-ATOMIC-1", "TEST_KEY_DUP_REF_0000001"),
    }),
    /REFERENCE_ALREADY_ISSUED/,
  );

  assert.equal(f.snapshot().invitations.length, 1);

  console.log("duplicate_reference_fail_closed=PASS");

  await assert.rejects(
    issue({
      client: f.client,
      input: input("FW-TEST-ATOMIC-2", key),
    }),
    /UNIQUE_DELIVERY_CLAIM/,
  );

  assert.equal(f.snapshot().invitations.length, 1);
  assert.equal(f.snapshot().deliveries.length, 1);
  assert.equal(f.snapshot().events.length, 1);

  console.log("duplicate_key_rolls_back=PASS");
}

{
  const f = fixture({ failClaim: true });

  await assert.rejects(
    issue({
      client: f.client,
      input: input("FW-TEST-CLAIM-FAIL", key),
    }),
    /SIMULATED_DELIVERY_CLAIM_FAILURE/,
  );

  assert.deepEqual(f.snapshot(), {
    invitations: [],
    deliveries: [],
    events: [],
  });

  console.log("claim_failure_rolls_back_all=PASS");
}

{
  const f = fixture();

  await issue({
    client: f.client,
    input: input("FW-TEST-LEGACY"),
  });

  assert.equal(f.snapshot().invitations.length, 1);
  assert.equal(f.snapshot().events.length, 1);
  assert.equal(f.snapshot().deliveries.length, 0);

  console.log("legacy_invitation_compatibility=PASS");
}

{
  const f = fixture({ authorized: false });

  await assert.rejects(
    issue({
      client: f.client,
      input: input("FW-TEST-UNAUTHORIZED", key),
    }),
    /ISSUER_NOT_AUTHORIZED/,
  );

  assert.equal(f.snapshot().invitations.length, 0);
  assert.equal(f.snapshot().deliveries.length, 0);
  assert.equal(f.snapshot().events.length, 0);

  console.log("unauthorized_issuer_fail_closed=PASS");
}

{
  const f = fixture();

  await assert.rejects(
    issue({
      client: f.client,
      input: input("FW-TEST-BAD-KEY", "short"),
    }),
    /DELIVERY_KEY_INVALID/,
  );

  assert.equal(f.snapshot().invitations.length, 0);

  console.log("invalid_delivery_key_fail_closed=PASS");
}

console.log("provider_calls=NONE");
console.log("actual_database_operations=NONE");
console.log("ATOMIC_DELIVERY_SMOKE=PASS");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
