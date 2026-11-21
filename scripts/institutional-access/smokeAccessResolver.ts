import assert from "node:assert/strict";
import {
  institutionalScopeAllowsAction,
  resolveInstitutionalAccessWithClient,
} from "../../src/domains/institutional-access/resolveInstitutionalAccessWithClient";

async function main() {
  assert.equal(institutionalScopeAllowsAction("PROFILE_VIEW", "VIEW"), true);
  assert.equal(institutionalScopeAllowsAction("PROFILE_VIEW", "VIEW_FORM"), false);
  assert.equal(institutionalScopeAllowsAction("PROFILE_VIEW", "SUBMIT_INTAKE"), false);
  assert.equal(institutionalScopeAllowsAction("LOI_INTAKE_ACCESS", "VIEW"), false);
  assert.equal(institutionalScopeAllowsAction("LOI_INTAKE_ACCESS", "VIEW_FORM"), true);
  assert.equal(institutionalScopeAllowsAction("LOI_INTAKE_ACCESS", "SUBMIT_INTAKE"), true);

  let calls = 0;
  let query: any;
  let result: any = null;
  const client = {
    institutionalAccessGrant: {
      async findFirst(input: unknown) {
        calls++;
        query = input;
        return result;
      },
    },
  };

  const base = {
    client: client as never,
    identity: { userId: "visitor-1", email: " Visitor@Example.com " },
    scope: "PROFILE_VIEW" as const,
    action: "VIEW" as const,
    resourceReference: "FW-PROFILE-2026-001",
    resourceVersion: 1,
    now: new Date("2026-10-09T00:00:00Z"),
  };

  for (const input of [
    { ...base, action: "SUBMIT_INTAKE" as const },
    { ...base, resourceVersion: 0 },
    { ...base, resourceVersion: 1.5 },
    { ...base, resourceReference: " " },
    { ...base, identity: { userId: "", email: "visitor@example.com" } },
    { ...base, identity: { userId: "visitor-1", email: " " } },
    { ...base, now: new Date("invalid") },
  ]) {
    assert.equal((await resolveInstitutionalAccessWithClient(input)).allowed, false);
  }
  assert.equal(calls, 0);

  assert.equal((await resolveInstitutionalAccessWithClient(base)).allowed, false);
  const where = query.where;
  assert.equal(where.recipientUserId, "visitor-1");
  assert.equal(where.recipientEmail, "visitor@example.com");
  assert.deepEqual(where.recipient, { email: "visitor@example.com" });
  assert.equal(where.scope, "PROFILE_VIEW");
  assert.equal(where.resourceReference, base.resourceReference);
  assert.equal(where.resourceVersion, 1);
  assert.equal(where.revokedAt, null);
  assert.deepEqual(where.issuedAt, { lte: base.now });
  assert.deepEqual(where.expiresAt, { gt: base.now });
  assert.deepEqual(where.request, {
    status: "APPROVED",
    requesterEmail: "visitor@example.com",
    scope: "PROFILE_VIEW",
    resourceReference: base.resourceReference,
    resourceVersion: 1,
  });

  result = {
    id: "grant-1",
    requestId: "request-1",
    recipientUserId: "visitor-1",
    scope: "PROFILE_VIEW",
    resourceReference: base.resourceReference,
    resourceVersion: 1,
    expiresAt: new Date("2026-10-10T00:00:00Z"),
  };
  const allowed = await resolveInstitutionalAccessWithClient(base);
  assert.equal(allowed.allowed, true);
  if (allowed.allowed) assert.equal(allowed.grant.id, "grant-1");

  console.log("PASS: action isolation, invalid-input denial, query constraints, and resolution contract.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
