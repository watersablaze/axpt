/**
 * FW-SCO 1E: read-only authoritative allocation register CONTRACT.
 * These are caller-supplied records, not independently authenticated records.
 * No mutation, grant, reservation, commercial approval, or issuance is possible here.
 */
import type { SourceReconciliation } from "./buyerSpecificScoSourceEvidence";

export type AllocationRegisterEntry = Readonly<{
  entryReference: string;
  sourceIdentityReference: string;
  capacityScopeReference: string;
  commitmentReference: string;
  buyerDraftReference: string;
  quantityKg: number;
  /** The documentary authority for this entry, not an authorization created here. */
  authorityReference: string;
  authorityEvidenceReference: string;
  effectiveAt: string;
  expiresAt: string | null;
  state: "DOCUMENTED" | "RELEASED" | "REVOKED";
  /** Revisions must preserve lineage instead of silently replacing prior terms. */
  supersedesEntryReference: string | null;
}>;
export type AllocationRegisterSnapshot = Readonly<{
  registerReference: string;
  asOf: string;
  /** An explicit declaration by the register custodian; cannot be proven by this module. */
  scopeCompleteness: "COMPLETE_ASSERTED" | "PARTIAL" | "UNKNOWN";
  custodianIdentityReference: string | null;
  snapshotEvidenceReference: string | null;
  entries: readonly AllocationRegisterEntry[];
}>;
export type AllocationRegisterAssessment = Readonly<{
  registerReference: string;
  asOf: string;
  buyerDraftReference: string;
  requestedQuantityKg: number;
  documentedToBuyerKg: number;
  documentedAcrossRegisterKg: number;
  uncommittedRequestKg: number;
  scopeCompleteness: AllocationRegisterSnapshot["scopeCompleteness"];
  posture: "RECONCILABLE_EVIDENCE" | "REVIEW_REQUIRED";
  blockers: readonly string[];
  limitations: readonly string[];
  authoritativeAllocationGranted: false;
  issuanceAuthorized: false;
  settlementAuthorized: false;
}>;
const nonblank=(s:string|null):s is string=>typeof s==="string"&&s.trim().length>0;
const quantity=(n:number)=>Number.isSafeInteger(n)&&n>0;
const instant=(s:string)=>typeof s==="string"&&/\d{4}-\d\d-\d\dT/.test(s)&&Number.isFinite(Date.parse(s));

/** Reviews snapshot consistency; never claims to authenticate external records. */
export function assessBuyerScoAllocationRegister(
  snapshot: AllocationRegisterSnapshot,
  source: SourceReconciliation,
): AllocationRegisterAssessment {
  if(!nonblank(snapshot.registerReference)||!instant(snapshot.asOf)||!nonblank(source.draftReference)||
     !quantity(source.requestedQuantityKg)) throw new Error("INVALID_REGISTER_CONTEXT");
  if(snapshot.asOf!==source.asOf) throw new Error("RECONCILIATION_AS_OF_MISMATCH");
  if(!["COMPLETE_ASSERTED","PARTIAL","UNKNOWN"].includes(snapshot.scopeCompleteness))
    throw new Error("INVALID_COMPLETENESS");
  const blockers:string[]=[];
  const asOf=Date.parse(snapshot.asOf);
  if(snapshot.scopeCompleteness!=="COMPLETE_ASSERTED") blockers.push("REGISTER_COMPLETENESS_UNESTABLISHED");
  if(!nonblank(snapshot.custodianIdentityReference)||!nonblank(snapshot.snapshotEvidenceReference))
    blockers.push("CUSTODIAN_SNAPSHOT_EVIDENCE_MISSING");
  const entryIds=new Set<string>();
  const commitmentRefs=new Set<string>();
  const activePerScope=new Map<string,number>();
  const sourceScopes=new Map<string,string>();
  let buyer=0,total=0;
  for(const e of snapshot.entries){
    if(![e.entryReference,e.sourceIdentityReference,e.capacityScopeReference,e.commitmentReference,
      e.buyerDraftReference,e.authorityReference,e.authorityEvidenceReference].every(nonblank)||
      !quantity(e.quantityKg)||!instant(e.effectiveAt)||
      (e.expiresAt!==null&&!instant(e.expiresAt))||
      !["DOCUMENTED","RELEASED","REVOKED"].includes(e.state)) throw new Error("INVALID_REGISTER_ENTRY");
    if(entryIds.has(e.entryReference)) throw new Error("DUPLICATE_REGISTER_ENTRY");
    entryIds.add(e.entryReference);
    if(e.supersedesEntryReference!==null&&(!nonblank(e.supersedesEntryReference)||e.supersedesEntryReference===e.entryReference))
      throw new Error("INVALID_SUPERSESSION");
    if(e.state!=="DOCUMENTED") continue;
    if(Date.parse(e.effectiveAt)>asOf) {blockers.push("FUTURE_COMMITMENT");continue;}
    if(e.expiresAt!==null&&Date.parse(e.expiresAt)<=asOf) continue;
    if(commitmentRefs.has(e.commitmentReference)) throw new Error("DUPLICATE_ACTIVE_COMMITMENT");
    commitmentRefs.add(e.commitmentReference);
    const priorSource=sourceScopes.get(e.capacityScopeReference);
    if(priorSource&&priorSource!==e.sourceIdentityReference) throw new Error("SCOPE_SOURCE_CONFLICT");
    sourceScopes.set(e.capacityScopeReference,e.sourceIdentityReference);
    const current=(activePerScope.get(e.capacityScopeReference)??0)+e.quantityKg;
    if(!Number.isSafeInteger(current)) throw new Error("QUANTITY_OVERFLOW");
    activePerScope.set(e.capacityScopeReference,current);
    total+=e.quantityKg;
    if(e.buyerDraftReference===source.draftReference) buyer+=e.quantityKg;
  }
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(buyer))throw new Error("QUANTITY_OVERFLOW");
  // Compare with the 1D reconciliation; this contract cannot independently map
  // scope capacity to each commitment. Any mismatch blocks advancement.
  if(total!==source.totalCommittedAcrossScopesKg) blockers.push("REGISTER_SOURCE_TOTAL_MISMATCH");
  if(buyer!==source.committedToBuyerKg) blockers.push("BUYER_COMMITMENT_MISMATCH");
  if(buyer>source.requestedQuantityKg) blockers.push("BUYER_COMMITMENT_EXCEEDS_REQUEST");
  if(total>source.verifiedCapacityKg) blockers.push("REGISTER_EXCEEDS_AGGREGATE_VERIFIED_CAPACITY");
  if(source.status!=="EVIDENCE_RECONCILED") blockers.push("SOURCE_EVIDENCE_NOT_RECONCILED");
  return Object.freeze({
    registerReference:snapshot.registerReference,asOf:snapshot.asOf,
    buyerDraftReference:source.draftReference,requestedQuantityKg:source.requestedQuantityKg,
    documentedToBuyerKg:buyer,documentedAcrossRegisterKg:total,
    uncommittedRequestKg:Math.max(0,source.requestedQuantityKg-buyer),
    scopeCompleteness:snapshot.scopeCompleteness,
    posture:blockers.length?"REVIEW_REQUIRED" as const:"RECONCILABLE_EVIDENCE" as const,
    blockers:Object.freeze([...new Set(blockers)]),
    limitations:Object.freeze([
      "Snapshot custody and source documents are not authenticated by this module",
      "Complete scope coverage is a custodian assertion; cross-system exclusivity remains unproven",
      "Aggregate capacity comparison does not prove per-scope capacity coverage",
      "A reconcilable snapshot is not allocation authority, issuance approval, or settlement capacity",
    ]),
    authoritativeAllocationGranted:false as const,
    issuanceAuthorized:false as const,
    settlementAuthorized:false as const,
  });
}
