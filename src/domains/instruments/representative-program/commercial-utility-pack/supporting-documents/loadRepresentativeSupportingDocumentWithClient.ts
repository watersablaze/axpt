import type { PrismaClient } from "@prisma/client";
import { loadRepresentativeCommercialUtilityPackWithClient } from "../application/loadRepresentativeCommercialUtilityPackWithClient";
import { findSupportingDocument } from "./catalog";

type Client = Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"] & Pick<PrismaClient, "document">;
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
  const document = await input.client.document.findUnique({ where: { id: publication.reference },
    select: { fileName: true, fileUrl: true, fileSize: true, mimeType: true } });
  if (!document || document.fileName !== publication.sourceFileName || document.fileSize !== publication.byteLength ||
      document.mimeType !== "application/pdf") return null;
  return { publication, canDownload: resource.canDownload === true, fileUrl: document.fileUrl };
}
