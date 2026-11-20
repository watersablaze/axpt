import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { reviewSelectedCommercialUtilityPackAdditions, releaseSelectedCommercialUtilityPackAdditions } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/releaseSelectedCommercialUtilityPackAdditions";
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_cup_additions_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_CUP_ADDITIONS_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({datasources: {db: {url: url.toString()}}});
const prefix = "cup-additions-" + randomUUID();
const actorUserId = prefix + "-admin", participantId = prefix + "-participant", packageId = prefix + "-pack";
const ids = [0, 1, 2].map(index => prefix + "-addition-" + index);
const selected = {actorUserId, packageId, resourceReleaseIds: ids};
const review = () => reviewSelectedCommercialUtilityPackAdditions({...selected, client});
async function main() {
  const identity: {database: string}[] = await client.$queryRaw`SELECT current_database() AS database`;
  assert.equal(identity[0].database, process.env.ARP_CUP_ADDITIONS_LOCAL_TEST);
  assert.equal(await client.user.count(), 0);
  await client.user.create({data: {id: actorUserId, username: prefix, email: prefix + "@example.invalid",
    passwordHash: "NOT_A_LOGIN_PASSWORD", displayName: "Local Admin", viewedDocs: [], isAdmin: true}});
  await client.representativeProgramParticipant.create({data: {id: participantId, userId: actorUserId,
    docketReference: prefix, displayName: "Local fixture", standing: "ACTIVE", createdByUserId: actorUserId}});
  await client.commercialUtilityPack.create({data: {id: packageId, participantId, reference: prefix + "-CUP",
    state: "PREPARING", releaseState: "PARTIAL", createdByUserId: actorUserId,
    modules: {create: {module: "DOCUMENTS", state: "RELEASED", releasedAt: new Date(1000), releasedByUserId: actorUserId}}}});
  await client.commercialUtilityPackResourceRelease.create({data: {id: prefix + "-existing", packageId,
    module: "DOCUMENTS", resourceType: "DOCUMENT", resourceId: "EXISTING", state: "RELEASED",
    canView: true, canPresent: true, canDownload: false, canTransmit: true, releasedAt: new Date(1000), releasedByUserId: actorUserId}});
  for (const id of ids) await client.commercialUtilityPackResourceRelease.create({data: {id, packageId,
    module: "DOCUMENTS", resourceType: "DOCUMENT", resourceId: id, state: "WITHHELD",
    canView: false, canDownload: false, canPresent: false, canTransmit: false, metadata: {edition: 1, sha256: "a".repeat(64)}}});
  const parent = await client.commercialUtilityPack.findUniqueOrThrow({where: {id: packageId}, include: {modules: true}});
  const existing = await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: prefix + "-existing"}});
  const rows = () => client.commercialUtilityPackResourceRelease.findMany({where: {id: {in: ids}}, orderBy: {id: "asc"}});
  const before = await rows();
  const first = await review();
  const reordered = await reviewSelectedCommercialUtilityPackAdditions({...selected, resourceReleaseIds: [...ids].reverse(), client});
  assert.equal(first.reviewHash, reordered.reviewHash);
  await assert.rejects(() => reviewSelectedCommercialUtilityPackAdditions({...selected, resourceReleaseIds: [ids[0], ids[0]], client}), /INPUT_INVALID/);
  await assert.rejects(() => reviewSelectedCommercialUtilityPackAdditions({...selected, resourceReleaseIds: [ids[0], "missing"], client}), /SELECTION_CONFLICT/);
  await client.user.update({where: {id: actorUserId}, data: {isAdmin: false}});
  await assert.rejects(review, /ADMIN_REQUIRED/);
  await client.user.update({where: {id: actorUserId}, data: {isAdmin: true}});
  const decision = {...selected, client, reviewHash: first.reviewHash, reason: "Local reviewed additions", confirmRelease: true};
  await client.commercialUtilityPackResourceRelease.update({where: {id: ids[0]}, data: {metadata: {edition: 2}}});
  await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions(decision), /REVIEW_CHANGED/);
  assert.ok((await rows()).every((row: {state: string}) => row.state === "WITHHELD"));
  await client.commercialUtilityPackResourceRelease.update({where: {id: ids[0]}, data: {metadata: before[0].metadata!}});
  const fresh = await review(); decision.reviewHash = fresh.reviewHash;
  const eventCount = await client.domainEvent.count();
  // Force the final batch audit to fail after real resource updates and events.
  const failing = new Proxy(client, {get(target, property) {
    if (property === "$transaction") return async (callback: (tx: unknown) => Promise<unknown>, options: object) =>
      target.$transaction(async (tx: unknown) => callback(new Proxy(tx as object, {get(transaction, key) {
        if (key === "domainEvent") {
          const delegate = Reflect.get(transaction, key);
          return {create: async (args: {data: {eventType: string}}) => {
            if (args.data.eventType === "COMMERCIAL_UTILITY_PACK_SELECTED_ADDITIONS_RELEASED") throw new Error("INJECTED_FINAL_AUDIT_FAILURE");
            return delegate.create(args);
          }};
        }
        const value = Reflect.get(transaction, key); return typeof value === "function" ? value.bind(transaction) : value;
      }})), options);
    const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value;
  }}) as Parameters<typeof releaseSelectedCommercialUtilityPackAdditions>[0]["client"];
  const rollbackBefore = await rows();
  await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions({...decision, client: failing}), /INJECTED_FINAL_AUDIT_FAILURE/);
  assert.deepEqual(await rows(), rollbackBefore); assert.equal(await client.domainEvent.count(), eventCount);
  console.log("✓ Stale metadata, duplicate/missing selections and non-Admin review denied; final audit failure rolls back all resource releases and events.");
  const attempts = await Promise.allSettled([
    releaseSelectedCommercialUtilityPackAdditions(decision), releaseSelectedCommercialUtilityPackAdditions(decision),
  ]);
  assert.equal(attempts.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(attempts.filter(result => result.status === "rejected").length, 1);
  const after = await rows();
  assert.ok(after.every((row: {state: string; canView: boolean; canDownload: boolean; canPresent: boolean; canTransmit: boolean}) =>
    row.state === "RELEASED" && !row.canView && !row.canDownload && !row.canPresent && !row.canTransmit));
  assert.deepEqual(after.map((row: {metadata: unknown}) => row.metadata), rollbackBefore.map((row: {metadata: unknown}) => row.metadata));
  assert.equal(await client.domainEvent.count(), eventCount + 4);
  await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions(decision));
  assert.equal(await client.domainEvent.count(), eventCount + 4);
  assert.deepEqual(await client.commercialUtilityPack.findUniqueOrThrow({where: {id: packageId}, include: {modules: true}}), parent);
  assert.deepEqual(await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: existing.id}}), existing);
  assert.equal(await client.institutionalAccessGrant.count(), 0); assert.equal(await client.emailLog.count(), 0);
  console.log("✓ Concurrent submission releases the selected additions once; replay adds no events, permissions remain withheld, and parent/existing history is unchanged.");
  console.log("ARP_SELECTED_CUP_ADDITIONS_LOCAL_OK");
}
main().catch(error => {console.error(error instanceof Error ? error.stack : "Acceptance failed"); process.exitCode = 1;}).finally(() => client.$disconnect());
