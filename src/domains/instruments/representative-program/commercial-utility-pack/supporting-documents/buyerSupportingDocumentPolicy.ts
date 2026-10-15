export const BUYER_SUPPORTING_DOCUMENT_KINDS = ["DECLARATION_OF_TRUST", "RESELLER_AGREEMENT", "SANCTIONS_SCREENING"] as const;
export function buyerPublicationScope(kind: string): "PROFILE_VIEW" | "SOURCE_AUTHORITY_VIEW" | "SUPPORTING_DOCUMENT_VIEW" | null {
  if (kind === "INSTITUTIONAL_PROFILE") return "PROFILE_VIEW";
  if (kind === "SOURCE_AUTHORITY") return "SOURCE_AUTHORITY_VIEW";
  return (BUYER_SUPPORTING_DOCUMENT_KINDS as readonly string[]).includes(kind) ? "SUPPORTING_DOCUMENT_VIEW" : null;
}
