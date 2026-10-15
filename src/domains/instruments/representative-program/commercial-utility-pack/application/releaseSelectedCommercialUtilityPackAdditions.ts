import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { releaseCommercialUtilityPackResourceWithClient } from "../commands/releaseCommercialUtilityPackResourceWithClient";

type Client = Parameters<typeof releaseCommercialUtilityPackResourceWithClient>[0]["client"] &
  Pick<PrismaClient, "commercialUtilityPack" | "$queryRaw">;
type Selection = { actorUserId: string; packageId: string; resourceReleaseIds: string[] };
type Resource = {
  id: string; packageId: string; module: string; resourceType: string; resourceId: string;
  label: string | null; state: string; canView: boolean; canDownload: boolean;
  canPresent: boolean; canTransmit: boolean; releasedAt: Date | null;
  releasedByUserId: string | null; updatedAt: Date; metadata: unknown;
};
type Pack = { id: string; reference: string; participantId: string; state: string;
  audience: string; releaseState: string; updatedAt: Date;
  modules: { id: string; module: string; state: string; updatedAt: Date }[] };
function selection(input: Selection) {
  const actorUserId = input.actorUserId.trim();
  const packageId = input.packageId.trim();
  if (!actorUserId || !packageId || packageId.length > 191 ||
    !Array.isArray(input.resourceReleaseIds) || !input.resourceReleaseIds.length ||
    input.resourceReleaseIds.length > 5 || input.resourceReleaseIds.some(
      id => typeof id !== "string" || !id.trim() || id.trim().length > 191
    )) throw new Error("[CUP_ADDITION_INPUT_INVALID]");
  const resourceReleaseIds = input.resourceReleaseIds.map(id => id.trim()).sort();
  if (new Set(resourceReleaseIds).size !== resourceReleaseIds.length)
    throw new Error("[CUP_ADDITION_INPUT_INVALID]");
  return { actorUserId, packageId, resourceReleaseIds };
}
// Sort JSON object keys so metadata ordering cannot alter the reviewed identity.
function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])
  );
  return value;
}
export async function reviewSelectedCommercialUtilityPackAdditions(input: Selection & { client: Client }) {
  const selected = selection(input);
  const actor = await input.client.user.findUnique({where: {id: selected.actorUserId}, select: {isAdmin: true}});
  if (!actor?.isAdmin) throw new Error("[CUP_ADDITION_ADMIN_REQUIRED]");
  const pack: Pack | null = await input.client.commercialUtilityPack.findUnique({
    where: {id: selected.packageId}, select: {
      id: true, reference: true, participantId: true, state: true, audience: true,
      releaseState: true, updatedAt: true,
      modules: {select: {id: true, module: true, state: true, updatedAt: true}, orderBy: {module: "asc"}},
    },
  });
  if (!pack || !["PREPARING", "CURRENT"].includes(pack.state) ||
    pack.audience !== "REPRESENTATIVE" || !["PARTIAL", "RELEASED"].includes(pack.releaseState))
    throw new Error("[CUP_ADDITION_PACKAGE_CONFLICT]");
  const resources: Resource[] = await input.client.commercialUtilityPackResourceRelease.findMany({
    where: {id: {in: selected.resourceReleaseIds}, packageId: pack.id}, orderBy: {id: "asc"},
  });
  if (resources.length !== selected.resourceReleaseIds.length)
    throw new Error("[CUP_ADDITION_SELECTION_CONFLICT]");
  for (const resource of resources) {
    const modules = pack.modules.filter(module => module.module === resource.module);
    if (resource.state !== "WITHHELD" || resource.releasedAt || resource.releasedByUserId ||
      modules.length !== 1 || modules[0].state !== "RELEASED")
      throw new Error("[CUP_ADDITION_RELEASE_STATE_CONFLICT]");
  }
  const reviewHash = createHash("sha256").update(JSON.stringify(canonical({selected, pack, resources}))).digest("hex");
  return {reviewHash, pack, resources};
}

/** Release only the reviewed additions. Resource permissions and parent release history are preserved.
 * No access grant, delegated authority, email, storage upload or publication refresh is performed.
 * Exact repeat of an old review is rejected: obtain a new review after a changed state.
 */
export async function releaseSelectedCommercialUtilityPackAdditions(input: Selection & {
  client: Pick<PrismaClient, "$transaction">; reviewHash: string; reason: string; confirmRelease: boolean;
}) {
  const selected = selection(input);
  const reason = input.reason.trim();
  if (!/^[a-f0-9]{64}$/.test(input.reviewHash) || !reason || reason.length > 4000 || input.confirmRelease !== true)
    throw new Error("[CUP_ADDITION_DECISION_INVALID]");
  return input.client.$transaction(async (tx: Client) => {
    // Parent first, then children in stable order. Never rewind a released module.
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPack" WHERE id = ${selected.packageId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackModuleRelease" WHERE "packageId" = ${selected.packageId} ORDER BY id FOR UPDATE`;
    for (const id of selected.resourceReleaseIds)
      await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackResourceRelease" WHERE id = ${id} FOR UPDATE`;
    const review = await reviewSelectedCommercialUtilityPackAdditions({...selected, client: tx});
    if (review.reviewHash !== input.reviewHash) throw new Error("[CUP_ADDITION_REVIEW_CHANGED]");
    const occurredAt = new Date();
    for (const resource of review.resources) {
      const module = review.pack.modules.find(entry => entry.module === resource.module)!;
      await releaseCommercialUtilityPackResourceWithClient({client: tx, resourceReleaseId: resource.id,
        actorUserId: selected.actorUserId, occurredAt, releasedModuleReview: {id: module.id, updatedAt: module.updatedAt}});
    }
    await tx.domainEvent.create({data: {
      streamType: "COMMERCIAL_UTILITY_PACK", streamId: review.pack.id,
      eventType: "COMMERCIAL_UTILITY_PACK_SELECTED_ADDITIONS_RELEASED", eventVersion: 1,
      payload: {resourceReleaseIds: selected.resourceReleaseIds, reviewHash: review.reviewHash, reason,
        permissionsUnchanged: true},
      metadata: {actorUserId: selected.actorUserId, source: "representative-program.commercial-utility-pack.selected-additions"}, occurredAt,
    }});
    return {packageId: review.pack.id, resourceReleaseIds: selected.resourceReleaseIds, releasedAt: occurredAt};
  }, {isolationLevel: "Serializable", maxWait: 10000, timeout: 30000});
}
