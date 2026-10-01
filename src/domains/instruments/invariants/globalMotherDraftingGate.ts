import { globalMotherV3Definition } from "../definitions/globalMotherV3Definition";

export type DraftingReceipt = { id: string; representedInstitution: string; positions: unknown };
export type DraftingIssue = { receiptId: string; institution: string; reference: string; responseType: string; note: string };
export type DraftingDisposition = { receiptId: string; reference: string; treatment: "CARRY_TO_DRAFTING"; note: string };
const expectedReferences = new Set<string>(globalMotherV3Definition.propositions.map(item => item.reference));
const canonical = ["AOTG", "ND Royal Ministry"] as const;
const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
export function globalMotherDraftingGate(receipts: readonly DraftingReceipt[]) {
  const represented = new Set(receipts.map(row => normalize(row.representedInstitution)));
  const missingInstitutions = canonical.filter(name => !represented.has(normalize(name)));
  const issues: DraftingIssue[] = [];
  let invalidResponses = false;
  for (const receipt of receipts) {
    if (!Array.isArray(receipt.positions) || receipt.positions.length !== expectedReferences.size) { invalidResponses = true; continue; }
    const seen = new Set<string>();
    for (const value of receipt.positions) {
      if (!value || typeof value !== "object" || Array.isArray(value)) { invalidResponses = true; continue; }
      const row = value as Record<string, unknown>;
      if (typeof row.reference !== "string" || !expectedReferences.has(row.reference) || seen.has(row.reference) ||
          !["AFFIRM", "CLARIFY", "REVISE", "DECLINE"].includes(String(row.responseType))) { invalidResponses = true; continue; }
      seen.add(row.reference);
      if (row.responseType !== "AFFIRM") {
        if (typeof row.note !== "string" || !row.note.trim()) invalidResponses = true;
        issues.push({ receiptId: receipt.id, institution: receipt.representedInstitution,
          reference: row.reference, responseType: String(row.responseType), note: typeof row.note === "string" ? row.note : "" });
      }
    }
  }
  return { missingInstitutions, issues, invalidResponses,
    canOpen: missingInstitutions.length === 0 && !invalidResponses && !issues.some(issue => issue.responseType === "DECLINE") };
}
export function validateGlobalMotherDraftingDispositions(issues: readonly DraftingIssue[], value: unknown): DraftingDisposition[] | null {
  if (!Array.isArray(value) || value.length !== issues.length) return null;
  const seen = new Set<string>();
  const result: DraftingDisposition[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    const issue = issues.find(issue => issue.receiptId === row.receiptId && issue.reference === row.reference);
    const key = `${row.receiptId}:${row.reference}`;
    if (!issue || issue.responseType === "DECLINE" || seen.has(key) || row.treatment !== "CARRY_TO_DRAFTING" ||
        typeof row.note !== "string" || row.note.trim().length < 20 || row.note.trim().length > 1000) return null;
    seen.add(key);
    result.push({ receiptId: issue.receiptId, reference: issue.reference, treatment: "CARRY_TO_DRAFTING", note: row.note.trim() });
  }
  return result.sort((a,b) => `${a.receiptId}:${a.reference}`.localeCompare(`${b.receiptId}:${b.reference}`));
}
