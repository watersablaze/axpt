import type { PrismaClient } from "@prisma/client";
import { findSupportingDocument } from "./catalog";

type Client = Pick<PrismaClient, "representativeProgramParticipant" | "commercialUtilityPack" | "commercialUtilityPackResourceRelease">;
type Pack = {
  participantId: string; version: number; audience: string; state: string; releaseState: string;
  modules: Array<{ module: string; state: string }>;
  resources: Array<{ id: string; module: string; resourceType: string; resourceId: string;
    state: string; canView: boolean; canDownload: boolean; metadata: unknown }>;
};
const moduleOrder = ["REPRESENTATION", "COMMERCIAL_PARAMETERS", "DOCUMENTS", "OPERATING_BOUNDARIES"] as const;

/** Same V1 visibility rules as the CUP projection, restricted to one supporting publication.
 * Each invocation reads current state; the delivery reader invokes it again after storage I/O.
 */
export async function loadRepresentativeSupportingDocumentWithClient(input: {
  client: Client; userId: string; resourceReleaseId: string;
}) {
  const userId = input.userId.trim();
  if (!userId || !input.resourceReleaseId || input.resourceReleaseId.length > 191) return null;
  const participants: Array<{ id: string }> = await input.client.representativeProgramParticipant.findMany({
    where: { userId }, take: 2, select: { id: true },
  });
  if (!participants.length) return null;
  if (participants.length !== 1) throw new Error("[REPRESENTATIVE_CUP_PARTICIPANT_CONTRADICTION]");
  const participantId = participants[0].id;
  const pack: Pack | null = await input.client.commercialUtilityPack.findUnique({
    where: { participantId_version: { participantId, version: 1 } },
    select: {
      participantId: true, version: true, audience: true, state: true, releaseState: true,
      modules: { select: { module: true, state: true } },
      resources: {
        where: { id: input.resourceReleaseId, module: "DOCUMENTS", resourceType: "DOCUMENT", state: "RELEASED", canView: true },
        select: { id: true, module: true, resourceType: true, resourceId: true,
          state: true, canView: true, canDownload: true, metadata: true },
      },
    },
  });
  if (!pack) return null;
  if (pack.participantId !== participantId || pack.version !== 1) throw new Error("[REPRESENTATIVE_CUP_IDENTITY_CONTRADICTION]");
  if (pack.audience !== "REPRESENTATIVE" || !["PREPARING", "CURRENT"].includes(pack.state) ||
      !["PARTIAL", "RELEASED"].includes(pack.releaseState)) return null;
  if (pack.modules.length !== moduleOrder.length ||
      new Set(pack.modules.map(entry => entry.module)).size !== moduleOrder.length ||
      moduleOrder.some(module => !pack.modules.some(entry => entry.module === module))) {
    throw new Error("[REPRESENTATIVE_CUP_MODULE_REGISTRY_CONTRADICTION]");
  }
  if (!pack.modules.some(entry => entry.module === "DOCUMENTS" && entry.state === "RELEASED")) return null;
  const matches = pack.resources.filter(resource => resource.id === input.resourceReleaseId &&
    resource.module === "DOCUMENTS" && resource.resourceType === "DOCUMENT" &&
    resource.state === "RELEASED" && resource.canView === true);
  if (matches.length !== 1) return null;
  const resource = matches[0];
  const publication = findSupportingDocument(resource.resourceId, 1);
  if (!publication) return null;
  const metadata = resource.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const record = metadata as Record<string, unknown>;
  if (record.publicationVersion !== publication.version || record.sha256 !== publication.sha256 ||
      record.byteLength !== publication.byteLength || record.mimeType !== "application/pdf" ||
      record.sourceFileName !== publication.sourceFileName || typeof record.fileUrl !== "string") return null;
  return { publication, canDownload: resource.canDownload === true, fileUrl: record.fileUrl };
}
