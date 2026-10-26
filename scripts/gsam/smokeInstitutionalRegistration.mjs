import assert from "node:assert/strict";
import { test } from "node:test";
import {
  registerGsamInstitutionalParticipation as register,
} from "../../src/domains/institutions/french-ward/gsam/registerGsamInstitutionalParticipation.ts";

function fixture() {
  let stored = null;
  let writes = 0;

  const table = {
    async findUnique({ where }) {
      assert.equal(where.reference, "FW-GSAM-JV-2026-001");
      return stored;
    },
    async create({ data }) {
      writes++;
      stored = {
        id: "test-participation",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return stored;
    },
  };

  return {
    client: { gsamInstitutionalParticipation: table },
    get stored() { return stored; },
    get writes() { return writes; },
    set stored(value) { stored = value; },
    table,
  };
}

test("first registration creates restricted record", async () => {
  const f = fixture();
  const result = await register({
    client: f.client,
    actorUserId: "admin-test",
  });

  assert.equal(result.created, true);
  assert.equal(f.writes, 1);
  assert.equal(result.record.reference, "FW-GSAM-JV-2026-001");
  assert.equal(result.record.representativeName, "James Crawford");
  assert.equal(result.record.createdByUserId, "admin-test");
  assert.equal(result.record.documentationStatus, "PENDING_REVIEW");
  assert.equal(result.record.accessStatus, "NOT_PROVISIONED");
});

test("identical retry does not write", async () => {
  const f = fixture();

  await register({ client: f.client, actorUserId: "admin-test" });
  const retry = await register({
    client: f.client,
    actorUserId: "admin-test",
  });

  assert.equal(retry.created, false);
  assert.equal(f.writes, 1);
});

test("conflicting existing identity is rejected", async () => {
  const f = fixture();

  await register({ client: f.client, actorUserId: "admin-test" });
  f.stored = { ...f.stored, representativeName: "Different Person" };

  await assert.rejects(
    register({ client: f.client, actorUserId: "admin-test" }),
    /GSAM_INSTITUTIONAL_PARTICIPATION_CONFLICT/,
  );

  assert.equal(f.writes, 1);
});

test("missing actor is rejected without writes", async () => {
  const f = fixture();

  await assert.rejects(
    register({ client: f.client, actorUserId: "  " }),
    /GSAM_REGISTRATION_ACTOR_REQUIRED/,
  );

  assert.equal(f.writes, 0);
});

test("concurrent reference collision resolves by rereading", async () => {
  const f = fixture();

  const first = await register({
    client: f.client,
    actorUserId: "admin-test",
  });

  f.table.create = async () => {
    throw {
      code: "P2002",
      meta: { target: ["reference"] },
    };
  };

  const second = await register({
    client: {
      gsamInstitutionalParticipation: {
        ...f.table,
        findUnique: async () => {
          if (!f.stored) return null;
          return null;
        },
      },
    },
    actorUserId: "admin-test",
  }).catch(error => error);

  assert.equal(first.created, true);
  assert.equal(second.code, "P2002");
});

test("concurrent identical insert is reconciled", async () => {
  const f = fixture();
  await register({
    client: f.client,
    actorUserId: "admin-test",
  });

  let reads = 0;
  const client = {
    gsamInstitutionalParticipation: {
      async findUnique() {
        reads++;
        return reads === 1 ? null : f.stored;
      },
      async create() {
        throw {
          code: "P2002",
          meta: { target: ["reference"] },
        };
      },
    },
  };

  const result = await register({
    client,
    actorUserId: "admin-test",
  });

  assert.equal(result.created, false);
  assert.equal(result.record.id, "test-participation");
  assert.equal(reads, 2);
  assert.equal(f.writes, 1);
});

test("concurrent conflicting identity is rejected", async () => {
  const f = fixture();
  await register({
    client: f.client,
    actorUserId: "admin-test",
  });

  let reads = 0;
  const client = {
    gsamInstitutionalParticipation: {
      async findUnique() {
        reads++;
        if (reads === 1) return null;
        return {
          ...f.stored,
          representativeName: "Conflicting Representative",
        };
      },
      async create() {
        throw {
          code: "P2002",
          meta: { target: ["reference"] },
        };
      },
    },
  };

  await assert.rejects(
    register({
      client,
      actorUserId: "admin-test",
    }),
    /GSAM_INSTITUTIONAL_PARTICIPATION_CONFLICT/,
  );

  assert.equal(reads, 2);
  assert.equal(f.writes, 1);
});

test("unrelated uniqueness failure is never reconciled", async () => {
  const f = fixture();

  f.table.create = async () => {
    throw {
      code: "P2002",
      meta: { target: ["otherUniqueField"] },
    };
  };

  await assert.rejects(
    register({ client: f.client, actorUserId: "admin-test" }),
    error => error.code === "P2002",
  );
});
