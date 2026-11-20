import { adaptFrenchWardCommercialPaperComposition } from "../composition/adaptFrenchWardCommercialPaperComposition";
import type { PrismaClient } from "@prisma/client";
import { commercialPapers, commercialPaperMetadata, commercialPaperPinMatches, type CommercialPaperKey } from "./catalog";

type Client = Pick<PrismaClient, "user" | "commercialUtilityPack" | "commercialUtilityPackResourceRelease" | "domainEvent" | "$queryRaw">;
/** Narrow additions path: never reopens a released module or refreshes existing resource content/permissions. */
export async function stageCommercialPapers(input: {
  client: Pick<PrismaClient, "$transaction">; actorUserId: string; packageId: string;
  keys: CommercialPaperKey[]; expectedContentHashes: Record<string, string>; expectedPublicationHashes?: Record<string, string>;
}) {
  const actorUserId = input.actorUserId.trim(), packageId = input.packageId.trim();
  const papers = commercialPapers();
  if (!actorUserId || !packageId || packageId.length > 191 || !Array.isArray(input.keys) ||
      input.keys.length < 1 || input.keys.length > 2 || new Set(input.keys).size !== input.keys.length ||
      input.keys.some(key => !papers.some(paper => paper.key === key)))
    throw new Error("[CUP_COMMERCIAL_PAPER_INPUT_INVALID]");
  const selected = papers.filter(paper => input.keys.includes(paper.key));
  if (selected.some(paper => input.expectedContentHashes[paper.key] !== paper.contentHash ||
      (paper.publicationHash !== null && input.expectedPublicationHashes?.[paper.key] !== paper.publicationHash)))
    throw new Error("[CUP_COMMERCIAL_PAPER_REVIEW_CHANGED]");
  return input.client.$transaction(async (tx: Client) => {
    const actor = await tx.user.findUnique({where: {id: actorUserId}, select: {isAdmin: true}});
    if (!actor?.isAdmin) throw new Error("[CUP_COMMERCIAL_PAPER_ADMIN_REQUIRED]");
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPack" WHERE id = ${packageId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackModuleRelease" WHERE "packageId" = ${packageId} ORDER BY id FOR UPDATE`;
    const pack = await tx.commercialUtilityPack.findUnique({where: {id: packageId}, include: {modules: true}});
    const documents = pack?.modules.filter((module: {module: string; state: string}) => module.module === "DOCUMENTS");
    if (!pack || pack.version !== 1 || pack.audience !== "REPRESENTATIVE" ||
        !["PREPARING", "CURRENT"].includes(pack.state) || !["PARTIAL", "RELEASED"].includes(pack.releaseState) ||
        documents?.length !== 1 || documents[0].state !== "RELEASED")
      throw new Error("[CUP_COMMERCIAL_PAPER_PACKAGE_CONFLICT]");
    const resources = [];
    for (const paper of selected) {
      const descriptor = adaptFrenchWardCommercialPaperComposition(paper);
      const where = {packageId_module_resourceType_resourceId: {
        packageId, module: descriptor.module, resourceType: descriptor.resourceType, resourceId: descriptor.sourceId,
      }};
      const existing = await tx.commercialUtilityPackResourceRelease.findUnique({where});
      if (existing) {
        if (!["WITHHELD", "RELEASED"].includes(existing.state) || !commercialPaperPinMatches(existing.metadata, paper))
          throw new Error("[CUP_COMMERCIAL_PAPER_EXISTING_CONFLICT]");
        resources.push({id: existing.id, reference: paper.reference, created: false});
        continue;
      }
      const resource = await tx.commercialUtilityPackResourceRelease.create({data: {
        packageId, module: "DOCUMENTS", resourceType: "STRUCTURED_CONTENT", resourceId: paper.reference,
        label: paper.title, state: "WITHHELD", canView: true, canDownload: false, canPresent: false, canTransmit: false,
        metadata: commercialPaperMetadata(paper),
      }});
      resources.push({id: resource.id, reference: paper.reference, created: true});
    }
    if (resources.some(resource => resource.created)) await tx.domainEvent.create({data: {
      streamType: "COMMERCIAL_UTILITY_PACK", streamId: packageId,
      eventType: "COMMERCIAL_UTILITY_PACK_COMMERCIAL_PAPERS_STAGED", eventVersion: 1,
      payload: {resources: resources.filter(resource => resource.created), papers: selected.map(paper => ({
        key: paper.key, reference: paper.reference, version: paper.version, contentHash: paper.contentHash, publicationHash: paper.publicationHash,
      })), releasePerformed: false}, metadata: {actorUserId, source: "representative-program.commercial-utility-pack.commercial-papers"},
    }});
    return {packageId, participantId: pack.participantId, resources, releasePerformed: false as const};
  }, {isolationLevel: "Serializable", maxWait: 10000, timeout: 30000});
}
