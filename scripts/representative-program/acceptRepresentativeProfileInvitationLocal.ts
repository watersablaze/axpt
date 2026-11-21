import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createRepresentativeProfileInvitationWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/createRepresentativeProfileInvitationWithClient";
import { projectFrenchWardInstitutionalProfile } from "../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { resolveInstitutionalAccessWithClient } from "../../src/domains/institutional-access/resolveInstitutionalAccessWithClient";

const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_profile_inv_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_PROFILE_INVITATION_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const prefix = "profile-invite-qa-" + randomUUID();
const actorId = prefix + "-actor";
const participantId = prefix + "-participant";
const instrumentId = prefix + "-instrument";
const partyId = prefix + "-party";
const appointmentId = prefix + "-appointment";
const packageId = prefix + "-pack";
const resourceId = prefix + "-resource";
const profile = projectFrenchWardInstitutionalProfile();
const recipientEmail = prefix + "@example.invalid";
const input = {
  resourceReleaseId: resourceId, recipientName: "Local Visitor",
  recipientEmail, recipientOrganization: "Local QA Institution",
  purpose: "Isolated database acceptance", idempotencyKey: randomUUID(),
};
const adminRecipients = ["local-admin@example.invalid"];
const run = (fields = input, db = client) => createRepresentativeProfileInvitationWithClient({ client: db, userId: actorId, fields, adminRecipients });
async function denied(code: string) {
  const count = await client.institutionalAccessGrant.count();
  await assert.rejects(() => run(), (error: unknown) => error instanceof Error && error.message === code);
  assert.equal(await client.institutionalAccessGrant.count(), count);
  assert.equal(await client.representativeProfileIntroduction.count(), 0);
  assert.equal(await client.user.count({ where: { email: recipientEmail } }), 0);
}
async function main() {
  const identity: Array<{ database: string }> = await client.$queryRaw`SELECT current_database() AS database`;
  assert.equal(identity[0].database, process.env.ARP_PROFILE_INVITATION_LOCAL_TEST);
  assert.equal(await client.user.count(), 0, "STOP: disposable database is not empty");
  await client.user.create({ data: {
    id: actorId, username: prefix, email: prefix + "-actor@example.invalid",
    passwordHash: "NOT_A_LOGIN_PASSWORD", displayName: "Local Representative", viewedDocs: [],
  } });
  await client.representativeProgramParticipant.create({ data: {
    id: participantId, userId: actorId, docketReference: prefix,
    displayName: "Local Representative", standing: "ACTIVE", createdByUserId: actorId,
  } });
  await client.institutionalInstrument.create({ data: {
    id: instrumentId, reference: prefix + "-APPT", title: "Local Appointment",
    kind: "REPRESENTATIVE_APPOINTMENT", status: "ACTIVE", createdByUserId: actorId,
  } });
  await client.instrumentParty.create({ data: {
    id: partyId, instrumentId, userId: actorId,
    displayName: "Local Representative", role: "COMMERCIAL_PARTICIPANT",
  } });
  await client.representativeProgramAppointment.create({ data: {
    id: appointmentId, participantId, instrumentId, instrumentPartyId: partyId,
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE", createdByUserId: actorId,
    effectiveAt: new Date(Date.now() - 60000),
  } });
  for (const key of ["ARP.INTRODUCTION", "ARP.COMMUNICATION"]) {
    await client.instrumentAuthority.create({ data: {
      instrumentId, authorityKey: key, title: key, action: key,
      authorityClass: "DELEGATED", holderPartyId: partyId,
      conditions: {}, effectiveAt: new Date(Date.now() - 60000), createdByUserId: actorId,
    } });
  }
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  const enumBlock = schema.match(/^enum CommercialUtilityPackModule \{([\s\S]*?)^\}/m);
  assert.ok(enumBlock);
  const modules = enumBlock[1].split(/\r?\n/).map(line => line.trim()).filter(line => /^[A-Z_]+$/.test(line));
  await client.commercialUtilityPack.create({ data: {
    id: packageId, participantId, reference: prefix + "-CUP", state: "CURRENT",
    releaseState: "PARTIAL", createdByUserId: actorId,
    modules: { create: modules.map(module => ({
      module: module as "REPRESENTATION", state: module === "REPRESENTATION" ? "RELEASED" as const : "WITHHELD" as const,
    })) },
  } });
  await client.commercialUtilityPackResourceRelease.create({ data: {
    id: resourceId, packageId, module: "REPRESENTATION", resourceType: "STRUCTURED_CONTENT",
    resourceId: profile.reference, state: "RELEASED", canView: true, canTransmit: false,
  } });
  await denied("INVITATION_NOT_AUTHORIZED");
  await client.commercialUtilityPackResourceRelease.update({ where: { id: resourceId }, data: { canTransmit: true } });
  await client.representativeProgramParticipant.update({ where: { id: participantId }, data: { standing: "SUSPENDED" } });
  await denied("INVITATION_NOT_AUTHORIZED");
  await client.representativeProgramParticipant.update({ where: { id: participantId }, data: { standing: "ACTIVE" } });
  await client.instrumentAuthority.updateMany({ where: { instrumentId, authorityKey: "ARP.INTRODUCTION" }, data: { revokedAt: new Date() } });
  await denied("INVITATION_NOT_AUTHORIZED");
  await client.instrumentAuthority.updateMany({ where: { instrumentId, authorityKey: "ARP.INTRODUCTION" }, data: { revokedAt: null } });
  console.log("✓ Withheld transmission, suspension, and revoked introduction deny all grant/account writes.");

  // Inject only the final audit failure; all preceding writes use real PostgreSQL.
  const failing = new Proxy(client, {
    get(target, property) {
      if (property === "$transaction") return async (callback: (tx: unknown) => Promise<unknown>, options: object) =>
        target.$transaction(async (tx: unknown) => callback(new Proxy(tx as object, {
          get(transaction, key) {
            if (key === "domainEvent") return { create: async () => { throw new Error("INJECTED_AUDIT_FAILURE"); } };
            const value = Reflect.get(transaction, key);
            return typeof value === "function" ? value.bind(transaction) : value;
          },
        })), options);
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as PrismaClient;
  await assert.rejects(() => run(input, failing), /INJECTED_AUDIT_FAILURE/);
  assert.equal(await client.user.count({ where: { email: recipientEmail } }), 0);
  assert.equal(await client.institutionalAccessRequest.count(), 0);
  assert.equal(await client.institutionalAccessGrant.count(), 0);
  assert.equal(await client.representativeProfileIntroduction.count(), 0);
  console.log("✓ Final audit failure rolls back recipient provisioning, request, grant, and introduction.");

  const first = await run();
  assert.equal(first.replay, false);
  const replay = await run();
  assert.equal(replay.replay, true);
  assert.equal(first.introduction.id, replay.introduction.id);
  await assert.rejects(() => run({ ...input, purpose: "Changed content" }), /IDEMPOTENCY_CONFLICT/);
  assert.equal(await client.institutionalAccessGrant.count(), 1);
  assert.equal(await client.representativeProfileIntroduction.count(), 1);
  assert.equal(await client.institutionalAccessEvent.count(), 3);
  assert.equal(await client.domainEvent.count(), 1);
  assert.equal(await client.userRole.count({ where: { userId: first.introduction.recipientUserId } }), 0);
  assert.equal(await client.representativeProgramParticipant.count({ where: { userId: first.introduction.recipientUserId } }), 0);
  console.log("✓ Exact replay creates one grant and one audit chain; changed submission is rejected without extra privileges.");
  const accessInput = {
    client, identity: { userId: first.introduction.recipientUserId, email: recipientEmail },
    scope: "PROFILE_VIEW" as const, action: "VIEW" as const,
    resourceReference: profile.reference, resourceVersion: profile.version,
  };
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, true);
  assert.equal((await resolveInstitutionalAccessWithClient({ ...accessInput, identity: { userId: actorId, email: recipientEmail } })).allowed, false);
  await client.institutionalAccessGrant.update({ where: { id: first.introduction.grantId }, data: { revokedAt: new Date() } });
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
  await client.institutionalAccessGrant.update({ where: { id: first.introduction.grantId }, data: { revokedAt: null, expiresAt: new Date(0) } });
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
  assert.equal(await client.emailLog.count(), 0);
  console.log("✓ Resulting grant admits its recipient; wrong identity, revocation, and expiry deny access.");
  console.log("ARP_PROFILE_INVITATION_LOCAL_DATABASE_OK");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Acceptance failed"); process.exitCode = 1; })
  .finally(() => client.$disconnect());
