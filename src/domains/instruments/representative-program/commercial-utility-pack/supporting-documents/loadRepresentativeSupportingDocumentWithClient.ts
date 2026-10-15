import type { PrismaClient } from "@prisma/client";
import { loadRepresentativeCommercialUtilityPackWithClient } from "../application/loadRepresentativeCommercialUtilityPackWithClient";
import { findSupportingDocument } from "./catalog";

type Client = Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"] & Pick<PrismaClient, "commercialUtilityPackResourceRelease">;
/** Resolve only an owned, currently viewable DOCUMENT resource with exact approved registration. */
export async function loadRepresentativeSupportingDocumentWithClient(input: {
  client: Client; userId: string; resourceReleaseId: string;
}) {
  if (!input.userId.trim() || !input.resourceReleaseId || input.resourceReleaseId.length > 191) return null;
  const pack = await loadRepresentativeCommercialUtilityPackWithClient({ client: input.client, userId: input.userId });
  const matches = pack?.modules.flatMap(entry => entry.module === "DOCUMENTS"
    ? entry.resources.filter(resource => resource.id === input.resourceReleaseId && resource.resourceType === "DOCUMENT") : []) ?? [];
  if (matches.length !== 1) return null;
  const resource = matches[0];
  const publication = findSupportingDocument(resource.resourceId, 1);
  if (!publication) return null;
  const registered = await input.client.commercialUtilityPackResourceRelease.findUnique({
    where: { id: input.resourceReleaseId }, select: { metadata: true },
  });
  const metadata: unknown = registered?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const record = metadata as Record<string, unknown>;
  if (record.publicationVersion !== publication.version || record.sha256 !== publication.sha256 ||
      record.byteLength !== publication.byteLength || record.mimeType !== "application/pdf" ||
      record.sourceFileName !== publication.sourceFileName || typeof record.fileUrl !== "string") return null;
  return { publication, canDownload: resource.canDownload === true, fileUrl: record.fileUrl };
}
