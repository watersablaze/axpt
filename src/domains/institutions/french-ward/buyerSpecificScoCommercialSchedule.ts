/**
 * Buyer-specific SCO commercial schedule, draft-only.
 * An inquiry and a proposed schedule are not evidence of supply allocation,
 * commercial approval, payment authority, publication or issuance.
 */
import type { BuyerScoDraft } from "./buyerSpecificSoftCorporateOffer";

export type CommercialTermKey =
  | "QUANTITY_AND_TRANCHES"
  | "PRICE_BASIS"
  | "GOOD_FAITH_TAP"
  | "DESTINATION_AND_REFINERY"
  | "EXPORT_AND_DELIVERY"
  | "ASSAY_RISK_AND_SETTLEMENT"
  | "OTHER";
export type ProposedDeviation = Readonly<{
  key: CommercialTermKey;
  proposedTerm: string;
  /** Specific baseline provision, where identified; not an acceptance of deviation. */
  baselineProvisionReference: string;
  reason: string;
  reviewRequired: true;
}>;
export type BuyerSpecificScoCommercialSchedule = Readonly<{
  draftReference: string;
  standingReference: string;
  standingEdition: number;
  standingContentHash: string;
  buyerRequestReference: string;
  buyerIdentityReference: string;
  kind: "TRANCHE" | "PROGRAM";
  requestedQuantityKg: number;
  /** Buyer-submitted scheduling preferences, not French-Ward allocation. */
  requestedTranches: readonly Readonly<{ quantityKg: number; proposedTiming: string }>[];
  destination: string | null;
  receivingRefinery: string | null;
  pricingProposal: string | null;
  tapProposal: string | null;
  exportDeliveryProposal: string | null;
  assaySettlementProposal: string | null;
  deviations: readonly ProposedDeviation[];
  posture: "DRAFT_FOR_COMMERCIAL_REVIEW";
  sourceAllocation: "UNVERIFIED";
  commercialApproval: null;
  issuanceAuthority: null;
  paymentInstructions: null;
}>;
export type ScheduleProposal = Readonly<{
  pricingProposal?: string;
  tapProposal?: string;
  exportDeliveryProposal?: string;
  assaySettlementProposal?: string;
  deviations?: readonly Readonly<{
    key: CommercialTermKey;
    proposedTerm: string;
    baselineProvisionReference: string;
    reason: string;
  }>[];
}>;

function optionalText(v: string | undefined, label: string): string | null {
  if (v === undefined) return null;
  const trimmed = v.trim();
  if (!trimmed) throw new Error(`EMPTY_${label}`);
  if (trimmed.length > 4000) throw new Error(`OVERSIZE_${label}`);
  return trimmed;
}
function requiredText(v: string, label: string): string {
  return optionalText(v, label) ?? (() => { throw new Error(`MISSING_${label}`); })();
}

/** Prepare a record for review; never silently accept proposed departures. */
export function prepareBuyerScoCommercialSchedule(
  draft: BuyerScoDraft,
  proposed: ScheduleProposal = {},
): BuyerSpecificScoCommercialSchedule {
  if (draft.lifecycle !== "DRAFT" || draft.allocation.state !== "UNVERIFIED" ||
      draft.approval !== null || draft.issuedAt !== null || draft.recipientAccess !== null)
    throw new Error("INELIGIBLE_DRAFT");
  const seen = new Set<CommercialTermKey>();
  const deviations = (proposed.deviations ?? []).map(d => {
    if (seen.has(d.key)) throw new Error("DUPLICATE_DEVIATION_KEY");
    seen.add(d.key);
    if (!["QUANTITY_AND_TRANCHES","PRICE_BASIS","GOOD_FAITH_TAP",
      "DESTINATION_AND_REFINERY","EXPORT_AND_DELIVERY",
      "ASSAY_RISK_AND_SETTLEMENT","OTHER"].includes(d.key))
      throw new Error("INVALID_DEVIATION_KEY");
    return Object.freeze({
      key:d.key,
      proposedTerm:requiredText(d.proposedTerm,"PROPOSED_TERM"),
      baselineProvisionReference:requiredText(d.baselineProvisionReference,"BASELINE_PROVISION"),
      reason:requiredText(d.reason,"DEVIATION_REASON"),
      reviewRequired:true as const,
    });
  });
  const req = draft.request;
  return Object.freeze({
    draftReference:draft.draftReference,
    standingReference:draft.baseline.reference,
    standingEdition:draft.baseline.edition,
    standingContentHash:draft.baseline.contentHash,
    buyerRequestReference:req.requestReference,
    buyerIdentityReference:req.buyerIdentityReference,
    kind:draft.kind,
    requestedQuantityKg:req.requestedQuantityKg,
    requestedTranches:Object.freeze((req.proposedTrancheSchedule ?? []).map(t =>
      Object.freeze({ quantityKg:t.quantityKg, proposedTiming:t.proposedTiming }))),
    destination:optionalText(req.destination,"DESTINATION"),
    receivingRefinery:optionalText(req.receivingRefinery,"REFINERY"),
    pricingProposal:optionalText(proposed.pricingProposal,"PRICE"),
    tapProposal:optionalText(proposed.tapProposal,"TAP"),
    exportDeliveryProposal:optionalText(proposed.exportDeliveryProposal,"EXPORT"),
    assaySettlementProposal:optionalText(proposed.assaySettlementProposal,"SETTLEMENT"),
    deviations:Object.freeze(deviations),
    posture:"DRAFT_FOR_COMMERCIAL_REVIEW" as const,
    sourceAllocation:"UNVERIFIED" as const,
    commercialApproval:null,
    issuanceAuthority:null,
    paymentInstructions:null,
  });
}
