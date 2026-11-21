import assert from "node:assert/strict";
import { deliverRepresentativeProfileInvitationWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeProfileInvitationWithClient";

function fixture() {
  const row = {
    id: "intro", actorUserId: "representative", grantId: "grant",
    recipientUserId: "visitor", recipientEmail: "visitor@example.invalid",
    recipientName: "Visitor", recipientOrganization: "Institution", purpose: "PRIVATE_OPERATOR_PURPOSE",
    resourceReference: "PROFILE", resourceVersion: 2,
    participant: { displayName: "Representative" }, adminRecipients: ["admin@example.invalid"],
    recipientDeliveryStatus: "QUEUED", adminDeliveryStatus: "QUEUED",
    grant: { scope: "PROFILE_VIEW", resourceReference: "PROFILE", resourceVersion: 2,
      recipientUserId: "visitor", recipientEmail: "visitor@example.invalid",
      revokedAt: null as Date | null, expiresAt: new Date(Date.now() + 3600000) },
  };
  const logs: unknown[] = [];
  const events: unknown[] = [];
  let tail = Promise.resolve();
  const tx = {
    $queryRaw: async () => [],
    representativeProfileIntroduction: {
      findFirst: async (args: { where: { id: string; actorUserId: string } }) =>
        args.where.id === row.id && args.where.actorUserId === row.actorUserId ? row : null,
      update: async (args: { data: object }) => { Object.assign(row, args.data); return row; },
      updateMany: async (args: { where: { recipientDeliveryStatus?: string; adminDeliveryStatus?: string }; data: object }) => {
        if (args.where.recipientDeliveryStatus && args.where.recipientDeliveryStatus !== row.recipientDeliveryStatus) return { count: 0 };
        if (args.where.adminDeliveryStatus && args.where.adminDeliveryStatus !== row.adminDeliveryStatus) return { count: 0 };
        Object.assign(row, args.data); return { count: 1 };
      },
    },
    emailLog: { create: async (value: unknown) => { logs.push(value); } },
    domainEvent: { create: async (value: unknown) => { events.push(value); } },
  };
  const client = {
    $transaction: async (run: (value: typeof tx) => Promise<unknown>) => {
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>(resolve => { release = resolve; });
      await previous;
      try { return await run(tx); } finally { release(); }
    },
  } as unknown as Parameters<typeof deliverRepresentativeProfileInvitationWithClient>[0]["client"];
  return { row, client, logs, events };
}
const options = {
  introductionId: "intro", actorUserId: "representative",
  mode: "send" as const, from: "French-Ward <sender@example.invalid>", replyTo: "reply@example.invalid",
  currentResource: { reference: "PROFILE", version: 2 },
};
async function main() {
  {
    const f = fixture(); let sent = 0;
    await deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, mode: "log", send: async () => { sent++; return { accepted: true, messageId: "never" }; } });
    assert.equal(sent, 0);
    assert.equal(f.row.recipientDeliveryStatus, "LOGGED_ONLY");
    assert.equal(f.row.adminDeliveryStatus, "LOGGED_ONLY");
    console.log("✓ Log mode sends no email and records both channels.");
  }
  {
    const f = fixture(); const messages: string[] = [];
    const send = async (message: { to: string[]; text: string }) => {
      messages.push(message.to[0]);
      if (message.to[0] === f.row.recipientEmail) {
        assert.ok(!message.text.includes("PRIVATE_OPERATOR_PURPOSE"));
        assert.ok(message.text.includes("/login?next=%2Ffrench-ward%2Fprofile"));
        return { accepted: true, messageId: "recipient-receipt" };
      }
      return { accepted: false };
    };
    await Promise.all([
      deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, send }),
      deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, send }),
    ]);
    assert.equal(messages.length, 2);
    assert.equal(f.row.recipientDeliveryStatus, "ACCEPTED");
    assert.equal(f.row.adminDeliveryStatus, "FAILED");
    assert.equal(f.logs.length, 2); assert.equal(f.events.length, 2);
    await deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, send });
    assert.equal(messages.length, 2);
    console.log("✓ Concurrent mock claims and replay send each channel once; failures remain separate.");
  }
  {
    const f = fixture(); let calls = 0;
    const send = async () => { calls++; throw new Error("uncertain network result"); };
    await deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, send });
    await deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client, send });
    assert.equal(calls, 2);
    assert.equal(f.row.recipientDeliveryStatus, "DELIVERY_UNKNOWN");
    assert.equal(f.row.adminDeliveryStatus, "DELIVERY_UNKNOWN");
    console.log("✓ Uncertain delivery is held and never automatically resent.");
  }
  for (const condition of ["revoked", "expired", "edition"] as const) {
    const f = fixture(); const recipients: string[] = [];
    if (condition === "revoked") f.row.grant.revokedAt = new Date();
    if (condition === "expired") f.row.grant.expiresAt = new Date(0);
    if (condition === "edition") f.row.grant.resourceVersion = 1;
    await deliverRepresentativeProfileInvitationWithClient({ ...options, client: f.client,
      send: async message => { recipients.push(message.to[0]); return { accepted: true, messageId: "admin-receipt" }; } });
    assert.deepEqual(recipients, ["admin@example.invalid"]);
    assert.equal(f.row.recipientDeliveryStatus, "FAILED");
    assert.equal(f.row.adminDeliveryStatus, "ACCEPTED");
  }
  console.log("✓ Revoked, expired, and stale-edition access block recipient mail while notifying Admin.");
  {
    const f = fixture(); let calls = 0;
    const result = await deliverRepresentativeProfileInvitationWithClient({ ...options, actorUserId: "other", client: f.client,
      send: async () => { calls++; return { accepted: true, messageId: "never" }; } });
    assert.equal(calls, 0); assert.equal(result.persistenceIssue, true);
    assert.equal(f.row.recipientDeliveryStatus, "QUEUED");
  }
  console.log("✓ Another actor cannot dispatch the introduction.");
  console.log("ARP_PROFILE_INVITATION_DELIVERY_MOCK_OK");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
