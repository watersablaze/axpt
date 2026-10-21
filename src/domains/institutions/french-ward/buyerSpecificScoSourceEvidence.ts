/**
 * FW-SCO 1D: read-only source capacity and allocation evidence reconciliation.
 * Source assertions are recorded as claims; this module neither verifies external
 * documents nor creates a binding allocation, inventory reservation or issuance.
 */
import type { BuyerSpecificScoCommercialSchedule } from "./buyerSpecificScoCommercialSchedule";
import { fingerprintBuyerScoSchedule } from "./buyerSpecificScoCommercialReview";

export type SourceEvidence = Readonly<{
  evidenceReference: string;
  sourceIdentityReference: string;
  capacityScopeReference: string;
  /** Evidence must be reviewed independently; unreviewed material has no verified capacity. */
  verificationState: "REVIEWED" | "UNREVIEWED" | "REJECTED";
  reviewerIdentityReference: string | null;
  reviewedAt: string | null;
  validUntil: string | null;
  supportedCapacityKg: number;
}>;
export type AllocationEvidence = Readonly<{
  commitmentReference: string;
  allocationAuthorityReference: string;
  allocationDocumentReference: string;
  sourceIdentityReference: string;
  capacityScopeReference: string;
  buyerDraftReference: string;
  /** A commitment is evidence of a claimed reservation, not a booking mutation. */
  committedQuantityKg: number;
  posture: "DOCUMENTED_COMMITMENT" | "UNCONFIRMED" | "REVOKED";
}>;
export type ReconciliationInput = Readonly<{
  asOf: string;
  schedule: BuyerSpecificScoCommercialSchedule;
  capacityEvidence: readonly SourceEvidence[];
  /** Complete known commitments for each represented scope, NOT merely this buyer. */
  scopeCommitmentLedger: readonly AllocationEvidence[];
}>;
export type SourceReconciliation = Readonly<{
  draftReference: string;
  scheduleDigestSha256: string;
  asOf: string;
  requestedQuantityKg: number;
  verifiedCapacityKg: number;
  committedToBuyerKg: number;
  totalCommittedAcrossScopesKg: number;
  uncoveredRequestKg: number;
  status: "EVIDENCE_RECONCILED" | "INSUFFICIENT_EVIDENCE";
  reviewedEvidenceReferences: readonly string[];
  commitmentReferences: readonly string[];
  limitations: readonly string[];
  sourceAllocationGranted: false;
  commercialApprovalGranted: false;
  issuanceAuthorized: false;
}>;
const kg = (value: number): boolean => Number.isSafeInteger(value) && value > 0;
const id = (value: string): boolean => typeof value === "string" && value.trim().length > 0;
const iso = (value: string): boolean => /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

/** Reconcile a caller-supplied full scope ledger; cannot establish global exclusivity. */
export function reconcileBuyerScoSourceEvidence(input: ReconciliationInput): SourceReconciliation {
  const {schedule,capacityEvidence,scopeCommitmentLedger}=input;
  const scheduleDigestSha256=fingerprintBuyerScoSchedule(schedule);
  if (!iso(input.asOf)) throw new Error("INVALID_AS_OF");
  if (!kg(schedule.requestedQuantityKg)) throw new Error("INVALID_REQUESTED_QUANTITY");
  const asOf=Date.parse(input.asOf);
  const scopes=new Map<string,{capacity:number,source:string,evidence:string}>();
  const evidenceIds=new Set<string>();
  for (const e of capacityEvidence) {
    if (![e.evidenceReference,e.sourceIdentityReference,e.capacityScopeReference].every(id) || !kg(e.supportedCapacityKg))
      throw new Error("INVALID_SOURCE_EVIDENCE");
    if (evidenceIds.has(e.evidenceReference)) throw new Error("DUPLICATE_EVIDENCE_REFERENCE");
    evidenceIds.add(e.evidenceReference);
    if (e.verificationState !== "REVIEWED") continue;
    if (!id(e.reviewerIdentityReference ?? "") || !iso(e.reviewedAt ?? "") || Date.parse(e.reviewedAt!) > asOf)
      throw new Error("INCOMPLETE_CAPACITY_REVIEW");
    if (e.validUntil !== null && (!iso(e.validUntil) || Date.parse(e.validUntil) < asOf)) continue;
    if (scopes.has(e.capacityScopeReference)) throw new Error("OVERLAPPING_CAPACITY_SCOPE");
    scopes.set(e.capacityScopeReference,{capacity:e.supportedCapacityKg,source:e.sourceIdentityReference,evidence:e.evidenceReference});
  }
  const commitments=new Set<string>();
  const perScope=new Map<string,number>();
  let buyerCommitted=0,totalCommitted=0;
  for(const c of scopeCommitmentLedger){
    if (![c.commitmentReference,c.allocationAuthorityReference,c.allocationDocumentReference,
      c.sourceIdentityReference,c.capacityScopeReference,c.buyerDraftReference].every(id) ||
      !kg(c.committedQuantityKg)) throw new Error("INVALID_COMMITMENT_EVIDENCE");
    if(commitments.has(c.commitmentReference)) throw new Error("DUPLICATE_COMMITMENT_REFERENCE");
    commitments.add(c.commitmentReference);
    if(c.posture !== "DOCUMENTED_COMMITMENT") continue;
    const scope=scopes.get(c.capacityScopeReference);
    if(!scope || scope.source !== c.sourceIdentityReference) throw new Error("COMMITMENT_OUTSIDE_VERIFIED_SCOPE");
    const sum=(perScope.get(c.capacityScopeReference)??0)+c.committedQuantityKg;
    if(!Number.isSafeInteger(sum) || sum>scope.capacity) throw new Error("OVERCOMMITTED_CAPACITY_SCOPE");
    perScope.set(c.capacityScopeReference,sum);
    totalCommitted+=c.committedQuantityKg;
    if(c.buyerDraftReference===schedule.draftReference) buyerCommitted+=c.committedQuantityKg;
  }
  const verifiedCapacity=[...scopes.values()].reduce((sum,s)=>sum+s.capacity,0);
  if(!Number.isSafeInteger(verifiedCapacity)||!Number.isSafeInteger(totalCommitted)||!Number.isSafeInteger(buyerCommitted))
    throw new Error("QUANTITY_OVERFLOW");
  const limitations=["Evidence review is recorded, not independently authenticated by this module",
    "Caller must provide a complete authoritative scope commitment ledger; cross-system double counting is not checked",
    "Delivery readiness, commercial approval, issuance authority and settlement remain separate"];
  return Object.freeze({
    draftReference:schedule.draftReference,scheduleDigestSha256,asOf:input.asOf,
    requestedQuantityKg:schedule.requestedQuantityKg,
    verifiedCapacityKg:verifiedCapacity,committedToBuyerKg:buyerCommitted,
    totalCommittedAcrossScopesKg:totalCommitted,
    uncoveredRequestKg:Math.max(0,schedule.requestedQuantityKg-buyerCommitted),
    status: verifiedCapacity>0?"EVIDENCE_RECONCILED" as const:"INSUFFICIENT_EVIDENCE" as const,
    reviewedEvidenceReferences:Object.freeze([...scopes.values()].map(s=>s.evidence)),
    commitmentReferences:Object.freeze([...commitments]),
    limitations:Object.freeze(limitations),
    sourceAllocationGranted:false as const,commercialApprovalGranted:false as const,issuanceAuthorized:false as const,
  });
}
