import {resolveTovPublication} from "../../../../institutions/french-ward/tovRepresentativeCopy";
import { TOV_PUBLICATION } from "../../../../institutions/french-ward/tovPublication";
import { createHash } from "node:crypto";
import { frenchWardTransactionOverview } from "../../../../institutions/french-ward/frenchWardTransactionOverview";
import { FRENCH_WARD_STANDING_SCO } from "../../../../institutions/french-ward/frenchWardStandingSoftCorporateOffer";

export const COMMERCIAL_PAPER_KEYS = ["TRANSACTION_OVERVIEW", "STANDING_SOFT_CORPORATE_OFFER"] as const;
export type CommercialPaperKey = (typeof COMMERCIAL_PAPER_KEYS)[number];
export type CommercialPaper = {
  key: CommercialPaperKey; reference: string; version: number; title: string;
  status: string; referenceStatus: string | null; contentHash: string; publicationHash: string | null;
  publicationHtml?:string; publicationRevision?:number;
  content: typeof frenchWardTransactionOverview | typeof FRENCH_WARD_STANDING_SCO;
};
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]),
  );
  return value;
}
/** Read-only candidate registry. Registration is neither issuance nor permission. */
export function commercialPapers(): CommercialPaper[] {
  return COMMERCIAL_PAPER_KEYS.map(key => {
    const content = key === "TRANSACTION_OVERVIEW" ? frenchWardTransactionOverview : FRENCH_WARD_STANDING_SCO;
    const version = "version" in content ? content.version : content.edition;
    if (!content.reference.trim() || !Number.isSafeInteger(version) || version < 1)
      throw new Error("[CUP_COMMERCIAL_PAPER_IDENTITY_INVALID]");
    const contentHash = createHash("sha256").update(JSON.stringify(canonical({key, version, content}))).digest("hex");
    const publicationHash = key === "TRANSACTION_OVERVIEW" ? createHash("sha256").update(TOV_PUBLICATION.html).digest("hex") : null;
    if (key === "TRANSACTION_OVERVIEW" && (TOV_PUBLICATION.reference !== content.reference ||
        TOV_PUBLICATION.version !== version || TOV_PUBLICATION.contentHash !== contentHash ||
        TOV_PUBLICATION.publicationHash !== publicationHash)) throw new Error("[CUP_TOV_PUBLICATION_CHANGED]");
    return {key, reference: content.reference, version, title: content.title, status: content.status,
      referenceStatus: "referenceStatus" in content ? content.referenceStatus : null,
      contentHash, publicationHash, content};
  });
}
export function findCommercialPaper(reference: string) {
  return commercialPapers().find(paper => paper.reference === reference) ?? null;
}
export function commercialPaperMetadata(paper: CommercialPaper) {
  return {commercialPaper: {schemaVersion: paper.publicationHash ? 2 : 1, key: paper.key, reference: paper.reference,
    version: paper.version, contentHash: paper.contentHash, ...(paper.publicationHash ? {publicationHash: paper.publicationHash} : {})}};
}
export function commercialPaperPinMatches(metadata: unknown, paper: CommercialPaper): boolean {
  if (!metadata || typeof metadata !== "object" || !("commercialPaper" in metadata)) return false;
  const pin = metadata.commercialPaper;
  return !!pin && typeof pin === "object" && "schemaVersion" in pin && pin.schemaVersion === (paper.publicationHash ? 2 : 1) &&
    "key" in pin && pin.key === paper.key && "reference" in pin && pin.reference === paper.reference &&
    "version" in pin && pin.version === paper.version && "contentHash" in pin && pin.contentHash === paper.contentHash &&
    (!paper.publicationHash || (paper.key==="TRANSACTION_OVERVIEW"
      ? resolveTovPublication(metadata)!==null
      : ("publicationHash" in pin && pin.publicationHash===paper.publicationHash)));
}
/** Used in both reviewed-additions and direct module-release commands. */
export function assertCommercialPaperReleasePin(resource: {
  module: string; resourceType: string; resourceId: string; metadata: unknown;
}) {
  const paper = findCommercialPaper(resource.resourceId);
  const marked = !!resource.metadata && typeof resource.metadata === "object" && "commercialPaper" in resource.metadata;
  if (!paper && !marked) return;
  if (!paper || resource.module !== "DOCUMENTS" || resource.resourceType !== "STRUCTURED_CONTENT" ||
      !commercialPaperPinMatches(resource.metadata, paper))
    throw new Error("[CUP_RESOURCE_RELEASE_COMMERCIAL_PAPER_CHANGED]");
}
