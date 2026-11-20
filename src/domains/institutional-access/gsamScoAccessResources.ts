export const GSAM_SCO_REFERENCES = {
  "GSAM-SCO-PROGRAM-100MT-2026-002": 1,
  "GSAM-SCO-PROGRAM-1000MT-2026-002": 1,
} as const;

export function isGsamScoAccessResource(scope: string, ref: string, version: number): boolean {
  return scope === "SUPPORTING_DOCUMENT_VIEW" && Object.prototype.hasOwnProperty.call(GSAM_SCO_REFERENCES, ref) &&
    GSAM_SCO_REFERENCES[ref as keyof typeof GSAM_SCO_REFERENCES] === version;
}
