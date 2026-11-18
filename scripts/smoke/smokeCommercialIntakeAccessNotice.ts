import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { sendCommercialIntakeAccessNoticeWithClient } from
  "../../src/domains/institutional-access/sendCommercialIntakeAccessNoticeWithClient";
import { renderCommercialIntakeAccessNotice } from
  "../../src/domains/institutional-access/renderCommercialIntakeAccessNotice";
import { FRENCH_WARD_COMMERCIAL_INTAKE } from
  "../../src/domains/institutions/french-ward/commercial";

const now = new Date("2026-11-18T14:00:00Z");

function fixture() {
  const recipientEmail = "buyer@example.invalid";
  const grant = {
    id: "grant-1",
    requestId: "request-1",
    recipientUserId: "buyer-1",
    recipientEmail,
    recipient: { id: "buyer-1", email: recipientEmail },
    scope: "LOI_INTAKE_ACCESS",
    resourceReference: FRENCH_WARD_COMMERCIAL_INTAKE.reference,
    resourceVersion: FRENCH_WARD_COMMERCIAL_INTAKE.version,
    issuedAt: new Date("2026-11-17T00:00:00Z"),
    expiresAt: new Date("2026-12-02T00:00:00Z"),
    revokedAt: null as Date | null,
  };
  const request = {
    id: "request-1",
    requesterName: "Test Buyer",
    requesterEmail: recipientEmail,
    status: "APPROVED",
    scope: "LOI_INTAKE_ACCESS",
    resourceReference: FRENCH_WARD_COMMERCIAL_INTAKE.reference,
    resourceVersion: FRENCH_WARD_COMMERCIAL_INTAKE.version,
    grant,
  };
  type Claim = {
    id: string;
    deliveryKey: string;
    requestId: string;
    grantId: string;
    recipientEmail: string;
    status: string;
    providerMessageId: string | null;
    errorCode: string | null;
  };
  const claims: Claim[] = [];
  const logs: unknown[] = [];
  const events: unknown[] = [];
  const db = {
    institutionalAccessRequest: {
      findUnique: async () => request,
    },
    institutionalAccessGrant: {
      findFirst: async () =>
        request.status === "APPROVED" &&
        request.scope === "LOI_INTAKE_ACCESS" &&
        !grant.revokedAt
          ? grant
          : null,
    },
    commercialIntakeAccessNoticeDelivery: {
      create: async ({ data }: { data: Record<string, string> }) => {
        if (
          claims.some(x => x.deliveryKey === data.deliveryKey) ||
          claims.some(x => x.grantId === data.grantId &&
            ["SENDING", "DELIVERY_UNKNOWN"].includes(x.status))
        ) throw Object.assign(new Error("unique"), { code: "P2002" });
        const claim: Claim = {
          ...data,
          id: `notice-${claims.length + 1}`,
          providerMessageId: null,
          errorCode: null,
        } as Claim;
        claims.push(claim);
        return claim;
      },
      findUnique: async ({ where }: { where: { deliveryKey: string } }) =>
        claims.find(x => x.deliveryKey === where.deliveryKey) ?? null,
      findFirst: async () =>
        claims.find(x => ["SENDING", "DELIVERY_UNKNOWN"].includes(x.status)) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Partial<Claim> }) => {
        const claim = claims.find(x => x.id === where.id)!;
        Object.assign(claim, data);
        return claim;
      },
    },
    emailLog: { create: async ({ data }: { data: unknown }) => logs.push(data) },
    domainEvent: { create: async ({ data }: { data: unknown }) => events.push(data) },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(db),
  };
  return { request, grant, claims, logs, events, client: db as unknown as PrismaClient };
}

const id = "delivery_key_1234567890123456";
const input = (client: PrismaClient, deliveryKey = id) => ({
  client,
  actorUserId: "operator-1",
  requestId: "request-1",
  deliveryKey,
  from: "French-Ward <french-ward@example.invalid>",
  now,
});

async function main() {
  {
    const f = fixture();
    let attempts = 0;
    const send = async () => { attempts++; return { data: { id: "provider-1" } }; };
    const first = await sendCommercialIntakeAccessNoticeWithClient({
      ...input(f.client), send,
    });
    const replay = await sendCommercialIntakeAccessNoticeWithClient({
      ...input(f.client), send,
    });
    assert.equal(first.status, "ACCEPTED");
    assert.equal(replay.alreadyAttempted, true);
    assert.equal(attempts, 1);
    assert.equal(f.claims.length, 1);
    assert.equal(f.logs.length, 1);
    assert.equal(f.events.length, 1);
    console.log("PASS accepted + same-key replay");
  }
  {
    const f = fixture();
    f.grant.revokedAt = now;
    await assert.rejects(
      sendCommercialIntakeAccessNoticeWithClient({
        ...input(f.client), send: async () => ({ data: { id: "never" } }),
      }),
      /LOI_NOTICE_GRANT_UNAVAILABLE/,
    );
    assert.equal(f.claims.length, 0);
    console.log("PASS revoked grant rejects before claim");
  }
  {
    const f = fixture();
    f.request.scope = "PROFILE_VIEW";
    await assert.rejects(
      sendCommercialIntakeAccessNoticeWithClient({
        ...input(f.client), send: async () => ({ data: { id: "never" } }),
      }),
      /LOI_NOTICE_GRANT_UNAVAILABLE/,
    );
    assert.equal(f.claims.length, 0);
    console.log("PASS wrong scope rejects before claim");
  }
  {
    const f = fixture();
    const first = await sendCommercialIntakeAccessNoticeWithClient({
      ...input(f.client),
      send: async () => { throw new Error("transport uncertain"); },
    });
    assert.equal(first.status, "DELIVERY_UNKNOWN");
    await assert.rejects(
      sendCommercialIntakeAccessNoticeWithClient({
        ...input(f.client, "delivery_key_2345678901234567"),
        send: async () => ({ data: { id: "never" } }),
      }),
      /LOI_NOTICE_UNRESOLVED_ATTEMPT/,
    );
    assert.equal(f.claims.length, 1);
    console.log("PASS uncertainty blocks new-key resend");
  }
  {
    const r = renderCommercialIntakeAccessNotice({
      recipientName: '<Buyer & "Partner">',
    });
    assert.ok(r.html.includes("&lt;Buyer &amp; &quot;Partner&quot;&gt;"));
    assert.ok(r.text.includes("non-binding"));
    console.log("PASS template escaping + non-binding wording");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
