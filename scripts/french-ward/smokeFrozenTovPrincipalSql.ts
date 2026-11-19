/**
 * FW-CD-1A.4 · Real principal SQL projection against an empty, disposable
 * PostgreSQL database, rolled back in full.
 *
 * Requires DATABASE_URL referencing a LOCAL empty database named fw_cd1a4_*
 * and FW_CD1A4_DISPOSABLE=YES. Never uses production database configuration.
 * Tests real loadPrincipalUserWithClient SQL rather than a mocked projection.
 * No email, session issuance, cookies, storage access or deployment.
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { loadPrincipalUserWithClient } from "@/domains/auth/loadPrincipalUserWithClient";
import { isAdmin } from "@/domains/auth/isAdmin";
import { isActivePersistedSession } from "@/lib/auth/sessionRecordPolicy";

async function main() {
  assert.equal(process.env.FW_CD1A4_DISPOSABLE, "YES", "Explicit disposable gate required");
  const rawUrl = process.env.DATABASE_URL;
  assert.ok(rawUrl, "DATABASE_URL required");
  const url = new URL(rawUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(url.hostname), "Nonlocal database prohibited");
  assert.match(dbName, /^fw_cd1a4_[a-z0-9_]+$/, "Database must be named fw_cd1a4_*");
  assert.equal(url.protocol, "postgresql:", "PostgreSQL URL required");

  const db = new PrismaClient({ datasources: { db: { url: rawUrl } } });
  const rollbackMarker = "FW_CD1A4_INTENTIONAL_ROLLBACK";
  try {
    await db.$transaction(async (tx: Pick<PrismaClient, "$queryRaw" | "$executeRawUnsafe">) => {
      // Empty database only. Refuse to touch an existing application schema.
      const found = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
      `;
      assert.equal(found[0]?.count, 0n, "STOP: disposable database is not empty");

      const ddl = [
        'CREATE TABLE public."User" (id text PRIMARY KEY, email text NOT NULL, "displayName" text, name text)',
        'CREATE TABLE public."Role" (id text PRIMARY KEY, key text NOT NULL)',
        'CREATE TABLE public."UserRole" ("userId" text NOT NULL, "roleId" text NOT NULL, "isActive" boolean NOT NULL, "revokedAt" timestamptz)',
        'CREATE TABLE public."Permission" (id text PRIMARY KEY, key text NOT NULL)',
        'CREATE TABLE public."RolePermission" ("roleId" text NOT NULL, "permissionId" text NOT NULL)',
        'CREATE TABLE public."RepresentativeProgramParticipant" ("userId" text NOT NULL, standing text NOT NULL)',
        'CREATE TABLE public."Session" ("tokenId" text PRIMARY KEY, "userId" text NOT NULL, status text NOT NULL, "expiresAt" timestamptz, "invalidatedAt" timestamptz, "endedAt" timestamptz)',
      ];
      for (const sql of ddl) await tx.$executeRawUnsafe(sql);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."User" (id,email,"displayName",name)
        VALUES ('fixture-actor','fixture@example.invalid','Fixture Actor',NULL),
               ('fixture-missing-roles','no-role@example.invalid','No Roles',NULL);
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."Role" (id,key)
        VALUES ('admin-role','ADMIN_PLATFORM'), ('viewer-role','REPRESENTATIVE');
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."Permission" (id,key) VALUES ('admin-perm','admin.access');
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."RolePermission" ("roleId","permissionId")
        VALUES ('admin-role','admin-perm');
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."UserRole" ("userId","roleId","isActive","revokedAt")
        VALUES ('fixture-actor','admin-role',true,NULL),
               ('fixture-actor','viewer-role',false,NULL);
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO public."Session" ("tokenId","userId",status,"expiresAt","invalidatedAt","endedAt")
        VALUES ('valid','fixture-actor','active',now()+interval '1 hour',NULL,NULL),
               ('revoked','fixture-actor','active',now()+interval '1 hour',now(),NULL),
               ('ended','fixture-actor','active',now()+interval '1 hour',NULL,now()),
               ('expired','fixture-actor','active',now()-interval '1 hour',NULL,NULL);
      `);

      const project = (id: string) => loadPrincipalUserWithClient(tx, id);
      const adminUser = await project("fixture-actor");
      assert.ok(adminUser);
      assert.deepEqual(adminUser.userRoles.map(r => r.role.key), ["ADMIN_PLATFORM"]);
      assert.equal(isAdmin({roles: adminUser.userRoles.map(r => r.role.key)}), true);
      assert.deepEqual(adminUser.userRoles[0].role.rolePermissions.map(p => p.permission.key), ["admin.access"]);
      console.log("PASS real SQL: active admin role and permission projected");

      await tx.$executeRawUnsafe(`
        UPDATE public."UserRole" SET "isActive" = false
        WHERE "userId" = 'fixture-actor' AND "roleId" = 'admin-role'
      `);
      let user = await project("fixture-actor");
      assert.ok(user);
      assert.equal(user.userRoles.length, 0);
      assert.equal(isAdmin({ roles: user.userRoles.map(r => r.role.key) }), false);
      console.log("PASS real SQL: inactive admin assignment suppressed");

      await tx.$executeRawUnsafe(`
        UPDATE public."UserRole" SET "isActive" = true, "revokedAt" = now()
        WHERE "userId" = 'fixture-actor' AND "roleId" = 'admin-role'
      `);
      user = await project("fixture-actor");
      assert.ok(user);
      assert.equal(user.userRoles.length, 0);
      assert.equal(isAdmin({ roles: user.userRoles.map(r => r.role.key) }), false);
      console.log("PASS real SQL: revoked admin assignment suppressed");

      assert.equal(await project("absent-user"), null);
      console.log("PASS real SQL: missing user returns null");

      const records = await tx.$queryRaw<Array<{
        tokenId:string; userId:string; status:string;
        expiresAt:Date|null; invalidatedAt:Date|null; endedAt:Date|null
      }>>`SELECT * FROM public."Session"`;
      assert.equal(records.length, 4);
      const byId = Object.fromEntries(records.map(r => [r.tokenId,r]));
      const now = new Date();
      assert.equal(isActivePersistedSession(byId.valid,"fixture-actor",now),true);
      for (const id of ["revoked","ended","expired"]) {
        assert.equal(isActivePersistedSession(byId[id],"fixture-actor",now),false, id);
      }
      assert.equal(isActivePersistedSession(byId.valid,"wrong-user",now),false);
      console.log("PASS real SQL: persisted session rows + canonical session policy");

      // Intentionally abort the transaction so ALL fixture DDL/DML is rolled back.
      throw new Error(rollbackMarker);
    }, { timeout: 30000 });
    throw new Error("STOP: rollback did not occur");
  } catch(error) {
    if (!(error instanceof Error) || error.message !== rollbackMarker) throw error;
    const remaining = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*)::bigint AS count FROM pg_catalog.pg_tables WHERE schemaname='public'
    `;
    assert.equal(remaining[0]?.count,0n,"Fixture schema remained after rollback");
    console.log("PASS transaction rollback: zero public tables remain");
    console.log("FW-CD-1A.4 DISPOSABLE POSTGRES SQL PROJECTION PASS");
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
