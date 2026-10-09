import assert from "node:assert/strict";
import { resolveInstitutionalVisitorSignInWithClient } from "../../src/domains/institutional-access/resolveInstitutionalVisitorSignInWithClient";

async function main() {
  let candidateCalls = 0;
  let grantAllowed = false;
  const client = {
    institutionalAccessGrant: {
      findMany: async () => {
        candidateCalls++;
        return [{
          scope: "LOI_INTAKE_ACCESS",
          resourceReference: "french-ward:commercial-intake:v1",
          resourceVersion: 1,
        }];
      },
      findFirst: async ({ where }: any) => {
        assert.equal(where.recipientUserId, "visitor-1");
        assert.equal(where.recipientEmail, "visitor@example.com");
        assert.equal(where.request.status, "APPROVED");
        assert.equal(where.revokedAt, null);
        assert.equal(where.scope, "LOI_INTAKE_ACCESS");
        assert.equal(where.resourceVersion, 1);
        assert.ok(where.expiresAt.gt instanceof Date);
        return grantAllowed ? { id: "grant-1" } : null;
      },
    },
  } as never;

  const base = {
    client,
    userId: "visitor-1",
    email: " Visitor@Example.com ",
    roles: [],
    permissions: [],
    representativeProgramParticipants: [],
  };

  assert.equal((await resolveInstitutionalVisitorSignInWithClient(base)).eligible, false);
  grantAllowed = true;

  const visitor = await resolveInstitutionalVisitorSignInWithClient(base);
  assert.equal(visitor.eligible, true);
  assert.equal(visitor.audience, "INSTITUTIONAL_VISITOR");

  const callsBeforePriorityChecks = candidateCalls;
  const admin = await resolveInstitutionalVisitorSignInWithClient({
    ...base, roles: ["ADMIN_PLATFORM"],
  });
  assert.equal(admin.audience, "ADMIN");

  const representative = await resolveInstitutionalVisitorSignInWithClient({
    ...base,
    representativeProgramParticipants: [{ standing: "PROVISIONAL" }],
  });
  assert.equal(representative.audience, "REPRESENTATIVE");
  assert.equal(candidateCalls, callsBeforePriorityChecks);

  grantAllowed = false;
  assert.equal((await resolveInstitutionalVisitorSignInWithClient(base)).eligible, false);

  console.log("PASS: visitor grant eligibility, denial after grant loss, and existing audience priority.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
