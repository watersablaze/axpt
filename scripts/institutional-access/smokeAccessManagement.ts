import assert from "node:assert/strict";
import {
  decideInstitutionalAccessWithClient,
  requestInstitutionalAccessWithClient,
} from "../../src/domains/institutional-access/manageInstitutionalAccessWithClient";

async function main() {
  let operatorAllowed = true;
  let recipientEmail = "visitor@example.com";
  let changedCount = 1;
  let grantCalls = 0;
  let decisionWrites = 0;
  let requestData: any;
  const events: any[] = [];

  const request = {
    id: "request-1",
    status: "PENDING",
    requesterEmail: "visitor@example.com",
    scope: "LOI_INTAKE_ACCESS",
    resourceReference: "french-ward:commercial-intake:v1",
    resourceVersion: 1,
  };

  const tx = {
    user: {
      findFirst: async () => operatorAllowed ? { id: "operator-1" } : null,
      findUnique: async () => ({ id: "visitor-1", email: recipientEmail }),
    },
    institutionalAccessRequest: {
      findUnique: async () => request,
      updateMany: async () => {
        decisionWrites++;
        return { count: changedCount };
      },
      create: async ({ data }: any) => {
        requestData = data;
        return { id: request.id, status: "PENDING", createdAt: new Date() };
      },
    },
    institutionalAccessGrant: {
      create: async ({ data }: any) => {
        grantCalls++;
        assert.equal(data.recipientEmail, request.requesterEmail);
        assert.equal(data.scope, request.scope);
        assert.equal(data.resourceReference, request.resourceReference);
        assert.equal(data.resourceVersion, request.resourceVersion);
        return { id: "grant-1" };
      },
    },
    institutionalAccessEvent: {
      create: async ({ data }: any) => { events.push(data); },
    },
  };

  const client = {
    ...tx,
    $transaction: async (execute: any) => execute(tx),
  } as never;

  const base = {
    client,
    actor: {
      userId: "operator-1",
      email: "operator@example.com",
      roles: [],
      permissions: ["INSTITUTIONAL_ACCESS_MANAGE" as const],
    },
    requestId: request.id,
    decision: "APPROVED" as const,
    reason: "Reviewed institutional purpose.",
    recipientUserId: "visitor-1",
    expiresAt: new Date(Date.now() + 86_400_000),
  };

  await assert.rejects(
    decideInstitutionalAccessWithClient({
      ...base, actor: { ...base.actor, permissions: [] },
    }),
    /MISSING_PERMISSION/,
  );

  operatorAllowed = false;
  await assert.rejects(decideInstitutionalAccessWithClient(base), /MISSING_PERMISSION/);
  operatorAllowed = true;

  recipientEmail = "different@example.com";
  await assert.rejects(decideInstitutionalAccessWithClient(base), /RECIPIENT_EMAIL_MISMATCH/);
  recipientEmail = request.requesterEmail;
  assert.equal(decisionWrites, 0);

  changedCount = 0;
  await assert.rejects(decideInstitutionalAccessWithClient(base), /ALREADY_DECIDED/);
  assert.equal(grantCalls, 0);
  assert.equal(events.length, 0);
  changedCount = 1;

  const approved = await decideInstitutionalAccessWithClient(base);
  assert.equal(approved.grantId, "grant-1");
  assert.deepEqual(events.map(event => event.type), ["APPROVED", "GRANTED"]);

  events.length = 0;
  const declined = await decideInstitutionalAccessWithClient({
    ...base, decision: "DECLINED",
    recipientUserId: undefined, expiresAt: undefined,
  });
  assert.equal(declined.grantId, null);
  assert.equal(grantCalls, 1);
  assert.deepEqual(events.map(event => event.type), ["DECLINED"]);

  await requestInstitutionalAccessWithClient({
    client,
    requesterName: " Visitor ",
    requesterEmail: " Visitor@Example.com ",
    institutionalAffiliation: "Example Institution",
    requesterCapacity: "Director",
    purpose: "Commercial review",
    scope: "LOI_INTAKE_ACCESS",
    resourceReference: request.resourceReference,
    resourceVersion: 1,
  });
  assert.equal(requestData.requesterEmail, request.requesterEmail);
  assert.equal(requestData.events.create.type, "REQUESTED");
  assert.equal(requestData.grant, undefined);

  console.log("PASS: permission checks, recipient binding, decision race denial, approval/decline audit, and request normalization.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
