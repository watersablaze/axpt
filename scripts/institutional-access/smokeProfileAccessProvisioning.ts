import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { projectFrenchWardInstitutionalProfile } from "../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { requestInstitutionalAccessWithClient } from "../../src/domains/institutional-access/manageInstitutionalAccessWithClient";
import {
  decideProfileAccessWithClient,
  revokeProfileAccessWithClient,
} from "../../src/domains/institutional-access/manageProfileAccessWithClient";
import { resolveInstitutionalAccessWithClient } from "../../src/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { resolveInstitutionalVisitorSignInWithClient } from "../../src/domains/institutional-access/resolveInstitutionalVisitorSignInWithClient";

async function main() {
  const connection = process.env.IA_PROFILE_ACCEPTANCE_URL;
  assert.ok(connection, "IA_PROFILE_ACCEPTANCE_URL required");
  const url = new URL(connection);
  assert.ok(["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname));
  assert.equal(url.pathname, "/arp_permission_acceptance_20261012");
  assert.equal(url.searchParams.get("schema") || "public", "public");

  const prisma = new PrismaClient({ datasources: { db: { url: connection } } });
  const prefix = `ia-profile-${randomUUID()}`;
  const requestIds: string[] = [];
  const emails: string[] = [];
  let roleId: string | undefined;
  let createdPermissionId: string | undefined;
  let operatorId: string | undefined;

  try {
    const rows = await prisma.$queryRaw`
      SELECT current_database() AS database
    `;
    assert.equal(rows[0].database, "arp_permission_acceptance_20261012");
    console.log("Isolated local acceptance database verified.");

    const profile = projectFrenchWardInstitutionalProfile();
    assert.equal(profile.reference, "FW-PROFILE-2026-001");
    assert.equal(profile.version, 2);

    const operator = await prisma.user.create({
      data: {
        username: `${prefix}-operator`,
        email: `${prefix}-operator@example.invalid`,
        passwordHash: "INERT_ACCEPTANCE_FIXTURE",
        displayName: "Synthetic Profile Operator",
        viewedDocs: [],
      },
    });
    operatorId = operator.id;
    emails.push(operator.email);

    let permission = await prisma.permission.findUnique({
      where: { key: "INSTITUTIONAL_ACCESS_MANAGE" },
    });
    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          key: "INSTITUTIONAL_ACCESS_MANAGE",
          label: "Manage Institutional Access",
        },
      });
      createdPermissionId = permission.id;
    }

    const role = await prisma.role.create({
      data: { key: `${prefix}-role`, label: "Synthetic Profile Operator" },
    });
    roleId = role.id;
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
    await prisma.userRole.create({
      data: { userId: operator.id, roleId: role.id, isActive: true },
    });

    const actor = {
      userId: operator.id,
      email: operator.email,
      displayName: operator.displayName,
      roles: [role.key],
      permissions: ["INSTITUTIONAL_ACCESS_MANAGE"],
      sessionId: null,
    } as never;

    async function request(label: string, version = profile.version) {
      const email = `${prefix}-${label}@example.invalid`;
      emails.push(email);
      const record = await requestInstitutionalAccessWithClient({
        client: prisma,
        requesterName: "Synthetic Profile Recipient",
        requesterEmail: ` ${email.toUpperCase()} `,
        institutionalAffiliation: "Acceptance fixture",
        requesterCapacity: "Reviewer",
        purpose: "Isolated Profile acceptance",
        scope: "PROFILE_VIEW",
        resourceReference: profile.reference,
        resourceVersion: version,
      });
      requestIds.push(record.id);
      return { id: record.id, email };
    }

    function decision(record: { id: string }) {
      return {
        client: prisma,
        actor,
        requestId: record.id,
        decision: "APPROVED" as const,
        reason: "Synthetic acceptance approval",
        expiresAt: new Date(Date.now() + 3600000),
      };
    }

    const first = await request("new");
    assert.equal(await prisma.user.count({ where: { email: first.email } }), 0);
    const approved = await decideProfileAccessWithClient(decision(first));
    assert.equal(approved.status, "APPROVED");
    assert.equal(approved.notificationSent, false);
    assert.equal(approved.recipientSignInUrl, "/login?next=%2Ffrench-ward%2Fprofile");

    const recipient = await prisma.user.findUnique({
      where: { email: first.email },
    });
    assert.ok(recipient);
    assert.equal(recipient.isAdmin, false);
    assert.equal(await prisma.userRole.count({ where: { userId: recipient.id } }), 0);
    assert.equal(await prisma.representativeProgramParticipant.count({
      where: { userId: recipient.id },
    }), 0);

    const accessInput = {
      client: prisma,
      identity: { userId: recipient.id, email: recipient.email },
      scope: "PROFILE_VIEW" as const,
      action: "VIEW" as const,
      resourceReference: profile.reference,
      resourceVersion: profile.version,
    };
    assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, true);
    assert.equal((await resolveInstitutionalAccessWithClient({
      ...accessInput, resourceVersion: 1,
    })).allowed, false);
    assert.equal((await resolveInstitutionalVisitorSignInWithClient({
      client: prisma, userId: recipient.id, email: recipient.email,
      roles: [], permissions: [], representativeProgramParticipants: [],
    })).audience, "INSTITUTIONAL_VISITOR");

    const events = await prisma.institutionalAccessEvent.findMany({
      where: { requestId: first.id },
    });
    assert.deepEqual(events.map((e: any) => e.type).sort(),
      ["APPROVED", "GRANTED", "REQUESTED"]);
    assert.equal(events.find((e: any) => e.type === "GRANTED")
      ?.metadata?.recipientProvisioned, true);
    console.log("PASS: normalized request, new recipient provisioning, edition binding and grant audit.");

    await assert.rejects(decideProfileAccessWithClient(decision(first)),
      /NOT_PENDING|ALREADY_DECIDED/);

    const existing = await request("existing");
    await prisma.user.create({
      data: {
        username: `${prefix}-existing`,
        email: existing.email,
        passwordHash: "EXISTING_HASH_MUST_REMAIN",
        displayName: "Existing Recipient",
        viewedDocs: [],
      },
    });
    await decideProfileAccessWithClient(decision(existing));
    const reused = await prisma.user.findUnique({ where: { email: existing.email } });
    assert.equal(reused.passwordHash, "EXISTING_HASH_MUST_REMAIN");
    assert.equal(reused.displayName, "Existing Recipient");
    console.log("PASS: existing account reused without changing credentials or identity.");

    const declined = await request("declined");
    await decideProfileAccessWithClient({
      ...decision(declined), decision: "DECLINED",
    });
    assert.equal(await prisma.user.count({ where: { email: declined.email } }), 0);
    assert.equal(await prisma.institutionalAccessGrant.count({
      where: { requestId: declined.id },
    }), 0);

    const stale = await request("stale", 1);
    await assert.rejects(decideProfileAccessWithClient(decision(stale)),
      /RESOURCE_MISMATCH/);
    assert.equal(await prisma.user.count({ where: { email: stale.email } }), 0);

    const unauthorized = await request("unauthorized");
    await assert.rejects(decideProfileAccessWithClient({
      ...decision(unauthorized),
      actor: { ...(actor as any), permissions: [] },
    }), /MISSING_PERMISSION/);
    console.log("PASS: decline, stale-edition and missing-permission denial create no recipient grant.");

    const rollback = await request("rollback");
    const failingClient = {
      $transaction: (execute: any, options: any) =>
        prisma.$transaction(async (tx: any) => {
          const wrapped = new Proxy(tx, {
            get(target, key) {
              if (key === "institutionalAccessEvent") {
                return {
                  create: async () => {
                    throw new Error("FORCED_ACCEPTANCE_AUDIT_FAILURE");
                  },
                };
              }
              const value = Reflect.get(target, key);
              return typeof value === "function" ? value.bind(target) : value;
            },
          });
          return execute(wrapped);
        }, options),
    } as never;
    await assert.rejects(decideProfileAccessWithClient({
      ...decision(rollback), client: failingClient,
    }), /FORCED_ACCEPTANCE_AUDIT_FAILURE/);
    assert.equal(await prisma.user.count({ where: { email: rollback.email } }), 0);
    assert.equal((await prisma.institutionalAccessRequest.findUnique({
      where: { id: rollback.id },
    })).status, "PENDING");
    assert.equal(await prisma.institutionalAccessEvent.count({
      where: { requestId: rollback.id },
    }), 1);
    assert.equal(await prisma.institutionalAccessGrant.count({
      where: { requestId: rollback.id },
    }), 0);
    console.log("PASS: audit failure rolls back account, approval and grant.");

    const race = await request("race");
    const results = await Promise.allSettled([
      decideProfileAccessWithClient(decision(race)),
      decideProfileAccessWithClient({
        ...decision(race), decision: "DECLINED",
      }),
    ]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    const loser = results.find(r => r.status === "rejected") as PromiseRejectedResult;
    assert.match(String(loser.reason), /NOT_PENDING|ALREADY_DECIDED/);
    const raced = await prisma.institutionalAccessRequest.findUnique({
      where: { id: race.id },
    });
    const expected = raced.status === "APPROVED" ? 1 : 0;
    assert.equal(await prisma.institutionalAccessGrant.count({
      where: { requestId: race.id },
    }), expected);
    assert.equal(await prisma.user.count({ where: { email: race.email } }), expected);
    console.log("PASS: competing decisions produce one outcome without orphan account or grant.");

    await prisma.institutionalAccessGrant.update({
      where: { requestId: first.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
    await prisma.institutionalAccessGrant.update({
      where: { requestId: first.id },
      data: { expiresAt: new Date(Date.now() + 3600000) },
    });

    const grant = await prisma.institutionalAccessGrant.findUnique({
      where: { requestId: first.id },
    });
    await prisma.userRole.updateMany({
      where: { userId: operator.id, roleId: role.id },
      data: { isActive: false },
    });
    await assert.rejects(revokeProfileAccessWithClient({
      client: prisma, actor, grantId: grant.id, reason: "Permission denial test",
    }), /MISSING_PERMISSION/);
    await prisma.userRole.updateMany({
      where: { userId: operator.id, roleId: role.id },
      data: { isActive: true },
    });

    await revokeProfileAccessWithClient({
      client: prisma, actor, grantId: grant.id, reason: "Synthetic revocation",
    });
    await revokeProfileAccessWithClient({
      client: prisma, actor, grantId: grant.id, reason: "Idempotent replay",
    });
    assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
    assert.equal(await prisma.institutionalAccessEvent.count({
      where: { requestId: first.id, type: "REVOKED" },
    }), 1);
    console.log("PASS: expiry, database permission recheck and idempotent revocation.");
  } finally {
    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.institutionalAccessEvent.deleteMany({
          where: { requestId: { in: requestIds } },
        });
        await tx.institutionalAccessGrant.deleteMany({
          where: { requestId: { in: requestIds } },
        });
        await tx.institutionalAccessRequest.deleteMany({
          where: { id: { in: requestIds } },
        });
        if (operatorId) {
          await tx.userRole.deleteMany({ where: { userId: operatorId } });
        }
        if (roleId) {
          await tx.rolePermission.deleteMany({ where: { roleId } });
          await tx.role.delete({ where: { id: roleId } });
        }
        if (createdPermissionId) {
          await tx.permission.delete({ where: { id: createdPermissionId } });
        }
        await tx.user.deleteMany({ where: { email: { in: emails } } });
      }, { timeout: 30000 });
      console.log("Profile acceptance fixtures removed.");
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch(error => {
  const secret = process.env.IA_PROFILE_ACCEPTANCE_URL;
  let message = String(error?.message ?? error);
  if (secret) message = message.split(secret).join("[REDACTED_CONNECTION]");
  console.error(message.replace(
    /postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[REDACTED_CONNECTION]",
  ));
  process.exitCode = 1;
});
