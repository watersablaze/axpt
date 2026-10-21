/**
 * French-Ward buyer-specific SCO proposal foundation.
 * Domain-only: no authority grant, approval, registry mutation, delivery or settlement.
 * The standing SCO remains the source of shared baseline terms.
 */
export type BuyerScoKind = "TRANCHE" | "PROGRAM";
export type BuyerScoLifecycle =
  | "DRAFT"
  | "COMMERCIAL_REVIEW"
  | "SOURCE_VERIFICATION"
  | "APPROVED_FOR_SPECIFIED_USE"
  | "ISSUED";
export type AllocationEvidenceState = "UNVERIFIED" | "VERIFIED";
export type ApprovalEvidence = Readonly<{
  approvalReference: string;
  authorityReference: string;
  approvedFor: string;
  approvedAt: string;
  standingEditionContentHash: string;
  buyerDraftContentHash: string;
}>;
export type StandingScoSnapshot = Readonly<{
  reference: string;
  edition: number;
  contentHash: string;
  /** Structured baseline data, preserved by the canonical standing SCO owner. */
  commercialBaselineReference: string;
}>;
export type BuyerScoRequest = Readonly<{
  requestReference: string;
  buyerLegalName: string;
  buyerIdentityReference: string;
  kind: BuyerScoKind;
  requestedQuantityKg: number;
  destination?: string;
  receivingRefinery?: string;
  proposedTrancheSchedule?: readonly Readonly<{ quantityKg: number; proposedTiming: string }>[];
  buyerRequirements?: string;
}>;
export type BuyerScoDraft = Readonly<{
  kind: BuyerScoKind;
  lifecycle: "DRAFT";
  baseline: StandingScoSnapshot;
  request: BuyerScoRequest;
  allocation: Readonly<{ state: "UNVERIFIED"; allocationEvidenceReference: null }>;
  overrides: readonly never[];
  approval: null;
  recipientAccess: null;
  issuedAt: null;
  /** Not a document or publication reference. */
  draftReference: string;
}>;

function nonEmpty(value: string, field: string): void {
  if (!value || !value.trim()) throw new Error(`INVALID_${field}`);
}
function validKg(value: number): boolean {
  return Number.isFinite(value) && Number.isSafeInteger(value) && value > 0;
}

/** Draft preparation only. Requires independent source verification and approval. */
export function prepareBuyerSpecificScoDraft(
  standing: StandingScoSnapshot,
  request: BuyerScoRequest,
  draftReference: string,
): BuyerScoDraft {
  nonEmpty(standing.reference, "STANDING_REFERENCE");
  nonEmpty(standing.contentHash, "STANDING_CONTENT_HASH");
  nonEmpty(standing.commercialBaselineReference, "BASELINE_REFERENCE");
  if (!Number.isSafeInteger(standing.edition) || standing.edition < 1) throw new Error("INVALID_STANDING_EDITION");
  nonEmpty(request.requestReference, "REQUEST_REFERENCE");
  nonEmpty(request.buyerLegalName, "BUYER_NAME");
  nonEmpty(request.buyerIdentityReference, "BUYER_IDENTITY");
  nonEmpty(draftReference, "DRAFT_REFERENCE");
  if (request.kind !== "TRANCHE" && request.kind !== "PROGRAM") throw new Error("INVALID_KIND");
  if (!validKg(request.requestedQuantityKg)) throw new Error("INVALID_QUANTITY");
  if (request.proposedTrancheSchedule) {
    if (request.kind !== "PROGRAM") throw new Error("SCHEDULE_REQUIRES_PROGRAM");
    if (!request.proposedTrancheSchedule.length || request.proposedTrancheSchedule.some(t => !validKg(t.quantityKg) || !t.proposedTiming.trim()))
      throw new Error("INVALID_SCHEDULE");
    const sum = request.proposedTrancheSchedule.reduce((s,t) => s + t.quantityKg, 0);
    if (!Number.isSafeInteger(sum) || sum !== request.requestedQuantityKg) throw new Error("SCHEDULE_QUANTITY_MISMATCH");
  }
  const baseline = Object.freeze({ ...standing });
  const trancheSchedule = request.proposedTrancheSchedule?.map(t => Object.freeze({ ...t }));
  const normalizedRequest = Object.freeze({ ...request, ...(trancheSchedule ? { proposedTrancheSchedule: Object.freeze(trancheSchedule) } : {}) });
  return Object.freeze({
    draftReference,
    kind: request.kind,
    lifecycle: "DRAFT" as const,
    baseline,
    request: normalizedRequest,
    allocation: Object.freeze({ state: "UNVERIFIED" as const, allocationEvidenceReference: null }),
    overrides: Object.freeze([]) as readonly never[],
    approval: null,
    recipientAccess: null,
    issuedAt: null,
  });
}
