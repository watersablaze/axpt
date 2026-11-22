import assert from "node:assert/strict";
import {
  reviewCommercialUtilityPackResourcePermissions as review,
  decideCommercialUtilityPackResourcePermissionsWithClient as decide,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/decideCommercialUtilityPackResourcePermissions";

const at = new Date("2026-10-01T00:00:00Z");
const initial = {
  id: "resource-a",
  packageId: "pack-a",
  module: "REPRESENTATION",
  resourceType: "STRUCTURED_CONTENT",
  resourceId: "FW-PROFILE-2026-001",
  label: "Institutional Profile",
  state: "RELEASED",
  releasedAt: at,
  releasedByUserId: "original-issuer",
  updatedAt: at,
  canView: true,
  canDownload: false,
  canPresent: false,
  canTransmit: false,
  package: {
    id: "pack-a",
    reference: "TEST-CUP-001",
    participantId: "participant-a",
    state: "PREPARING",
    releaseState: "PARTIAL",
    audience: "REPRESENTATIVE",
    updatedAt: at,
    modules: [{
      module: "REPRESENTATION",
      state: "RELEASED",
      updatedAt: at,
    }],
  },
};

let resource = structuredClone(initial);
let events: any[] = [];
let admin = true;
let auditFails = false;
let concurrent = false;
let writes = 0;

const client: any = {
  user: { findUnique: async () => ({ isAdmin: admin }) },
  commercialUtilityPackResourceRelease: {
    findUnique: async () => structuredClone(resource),
    updateMany: async ({ where, data }: any) => {
      writes++;
      if (concurrent) return { count: 0 };
      assert.equal(where.id, resource.id);
      assert.equal(where.updatedAt.getTime(), resource.updatedAt.getTime());
      assert.deepEqual(Object.keys(data).sort(), [
        "canDownload", "canPresent", "canTransmit", "canView",
      ]);
      resource = {
        ...resource, ...data,
        updatedAt: new Date(resource.updatedAt.getTime() + 1000),
      };
      return { count: 1 };
    },
  },
  domainEvent: {
    create: async ({ data }: any) => {
      if (auditFails) throw new Error("TEST_AUDIT_FAILURE");
      events.push(structuredClone(data));
      return { id: "event-a", ...data };
    },
  },
};

const identity = {
  client, actorUserId: "operator-a", resourceReleaseId: "resource-a",
};
const next = {
  canView: true, canDownload: false, canPresent: true, canTransmit: true,
};

// Models the caller's transaction rollback; not a PostgreSQL test.
async function transaction(operation: () => Promise<unknown>) {
  const before = structuredClone(resource);
  const priorEvents = structuredClone(events);
  try { return await operation(); }
  catch (error) {
    resource = before;
    events = priorEvents;
    throw error;
  }
}

async function main() {
  admin = false;
  await assert.rejects(() => review(identity), /ADMIN_REQUIRED/);
  admin = true;
  const prepared = await review(identity);
  const input = {
    ...identity, reviewHash: prepared.reviewHash,
    permissions: next, reason: "Approved institutional Profile use",
    confirmDecision: true,
  };

  await assert.rejects(() => decide({ ...input, confirmDecision: false }),
    /DECISION_INVALID/);
  await assert.rejects(() => decide({
    ...input, permissions: { ...next, canView: false },
  }), /DECISION_INVALID/);
  await assert.rejects(() => decide({ ...input, reason: " " }),
    /DECISION_INVALID/);
  assert.equal(writes, 0);
  console.log("✓ Canonical admin, explicit confirmation, reason, and coherent permissions required.");

  resource.label = "Changed label";
  await assert.rejects(() => decide(input), /REVIEW_CHANGED/);
  resource = structuredClone(initial);

  for (const state of ["SUPERSEDED", "WITHDRAWN"]) {
    resource.package.state = state;
    await assert.rejects(() => review(identity), /RELEASE_STATE_CONFLICT/);
  }
  resource = structuredClone(initial);
  resource.package.modules[0].state = "READY";
  await assert.rejects(() => review(identity), /RELEASE_STATE_CONFLICT/);
  resource = structuredClone(initial);
  console.log("✓ Changed reviews and ineligible package/module states block decisions.");

  concurrent = true;
  await assert.rejects(() => decide(input), /REVIEW_CHANGED/);
  concurrent = false;
  assert.equal(events.length, 0);

  auditFails = true;
  await assert.rejects(() => transaction(() => decide(input)), /TEST_AUDIT_FAILURE/);
  auditFails = false;
  assert.deepEqual(resource, initial);
  assert.equal(events.length, 0);
  console.log("✓ Concurrent update rejection creates no event; audit failure propagates for transaction rollback.");

  const result: any = await transaction(() => decide(input));
  assert.equal(result.changed, true);
  assert.equal(events.length, 1);
  const event = events[0];
  assert.equal(event.streamId, "pack-a");
  assert.equal(event.eventType, "COMMERCIAL_UTILITY_PACK_RESOURCE_PERMISSIONS_DECIDED");
  assert.equal(event.metadata.actorUserId, "operator-a");
  assert.equal(event.payload.reason, input.reason);
  assert.deepEqual(event.payload.permissions, next);
  assert.equal(event.payload.previous.canTransmit, false);
  assert.equal(resource.releasedAt.getTime(), initial.releasedAt.getTime());
  assert.equal(resource.releasedByUserId, initial.releasedByUserId);
  assert.deepEqual(resource.package, initial.package);
  console.log("✓ Decision records previous/new permissions and operator reason while preserving release history.");

  await assert.rejects(() => decide(input), /REVIEW_CHANGED/);
  const fresh = await review(identity);
  const writesBefore = writes;
  const replay = await decide({ ...input, reviewHash: fresh.reviewHash });
  assert.equal(replay.changed, false);
  assert.equal(writes, writesBefore);
  assert.equal(events.length, 1);
  console.log("✓ Stale submission is rejected; freshly reviewed unchanged decision creates no write or event.");
  console.log("CUP_RESOURCE_PERMISSION_DECISION_CONTRACT_OK");
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
