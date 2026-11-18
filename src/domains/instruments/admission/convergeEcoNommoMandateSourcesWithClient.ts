/**
 * ECN-REG-1C.2D.4F — NON-OPERATIVE source convergence.
 *
 * Orchestrates the two existing read-only readers and preserves the original
 * negative-only assessments. No input is a verified institutional mandate:
 * neither canonical DB associations nor caller-supplied evidence observations
 * can become trusted authority facts here. No HTTP or write integration.
 */
import {
  loadCanonicalInstitutionalMandateSourcesWithClient,
  type CanonicalMandateSourceClient,
  type CanonicalMandateSourceResult,
} from "./loadCanonicalInstitutionalMandateSourcesWithClient";
import {
  inspectEcoNommoSourceCoverageWithClient,
  type EcoNommoSourceCoverageReport,
  type EcoNommoCoverageKey,
} from "./inspectEcoNommoSourceCoverageWithClient";
import type { EcoNommoSourceAssemblyClient } from "./assembleEcoNommoReadOnlySourcesWithClient";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { InstitutionalDelegationIdentitySources } from "./assessInstitutionalDelegationIdentityBinding";
import type { MandateEvidenceAuthenticationSources } from "./assessIndependentMandateEvidence";
import type { MandateCurrentnessSnapshot } from "./assessEcoNommoMandateCurrentness";
import type { DelegationProvenanceClaim } from "./assessEcoNommoDelegationProvenance";

type DraftScope = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" | "sourceReference" |
  "sourceEdition" | "instrumentStatus" | "versionStatus">;

export type EcoNommoConvergedFinding = Readonly<{
  key: EcoNommoCoverageKey;
  coverage: "STRUCTURAL_ONLY" | "UNQUALIFIED" | "MISSING";
  gaps: readonly string[];
  authenticated: false;
}>;

export type EcoNommoConvergenceReport = Readonly<{
  disposition: "BLOCKED_SOURCE_CONFLICT" | "BLOCKED_SOURCE_INCOMPLETE" | "BLOCKED_AUTHENTICATION_REQUIRED";
  canonical: CanonicalMandateSourceResult;
  coverage: EcoNommoSourceCoverageReport;
  findings: readonly EcoNommoConvergedFinding[];
  unresolved: readonly string[];
  sourceConflicts: readonly string[];
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

/**
 * The caller must supply a server-authenticated session user ID. Reject a
 * missing/mismatched actor before either injected source client is consulted.
 * Observation inputs remain UNTRUSTED, even when they happen to agree.
 */
export async function convergeEcoNommoMandateSourcesWithClient(params: Readonly<{
  client: CanonicalMandateSourceClient & EcoNommoSourceAssemblyClient;
  sessionUserId: string | null;
  admission: DraftScope;
  candidate: EcoNommoMandateEvidenceCandidate | null | undefined;
  mandateInstrumentReference: string;
  at: Date;
  identityObservations?: InstitutionalDelegationIdentitySources | null;
  evidenceObservations?: MandateEvidenceAuthenticationSources | null;
  currentnessSnapshot?: MandateCurrentnessSnapshot | null;
  provenanceClaim?: DelegationProvenanceClaim | null;
}>): Promise<EcoNommoConvergenceReport> {
  // Both readers independently refuse mismatched actors; the canonical
  // reader is called first and must not perform a lookup on that path.
  const canonical = await loadCanonicalInstitutionalMandateSourcesWithClient({
    client: params.client,
    sessionUserId: params.sessionUserId,
    holderUserId: params.admission.actorUserId,
    instrumentReference: params.mandateInstrumentReference,
    at: params.at,
  });
  const coverage = await inspectEcoNommoSourceCoverageWithClient({
    client: params.client, sessionUserId: params.sessionUserId,
    admission: params.admission, candidate: params.candidate, at: params.at,
    identityObservations: params.identityObservations,
    evidenceObservations: params.evidenceObservations,
    currentnessSnapshot: params.currentnessSnapshot,
    provenanceClaim: params.provenanceClaim,
  });
  // A source-coverage entry may be structural even when the canonical
  // instrument is missing. Downgrade, never upgrade, its classification.
  const canonicalMissing = canonical.standing === "SOURCE_NOT_FOUND" ||
    canonical.standing === "SOURCE_INCOMPLETE" ||
    canonical.standing === "SOURCE_CONFLICTED";
  const findings: EcoNommoConvergedFinding[] = coverage.findings.map(f => ({
    key: f.key,
    coverage: canonicalMissing && (
      f.key === "CUSTODY_DIGEST" || f.key === "MANDATE_CURRENTNESS"
    ) ? "MISSING" : f.coverage,
    gaps: [...f.gaps],
    authenticated: false,
  }));
  const sourceConflicts = [
    ...(canonical.standing === "SOURCE_CONFLICTED"
      ? canonical.reasons.map(r => "CANONICAL:" + r) : []),
    ...Object.entries(coverage.decisions)
      .filter(([, standing]) => standing === "SOURCE_CONFLICTED")
      .map(([name]) => "ASSESSMENT:" + name + ":SOURCE_CONFLICTED"),
  ];
  const unresolved = [...new Set([
    ...canonical.reasons.map(r => "CANONICAL:" + r),
    ...coverage.sourceWarnings.map(r => "RECOGNITION:" + r),
    ...findings.flatMap(f => f.gaps.map(g => f.key + ":" + g)),
    ...Object.entries(coverage.decisions).map(([key, standing]) =>
      "ASSESSMENT:" + key + ":" + standing),
  ])];
  const disposition: EcoNommoConvergenceReport["disposition"] =
    sourceConflicts.length > 0 ? "BLOCKED_SOURCE_CONFLICT" :
    canonicalMissing || coverage.findings.some(f => f.coverage === "MISSING") ||
      Object.values(coverage.decisions).some(x => x === "SOURCE_INCOMPLETE")
      ? "BLOCKED_SOURCE_INCOMPLETE" : "BLOCKED_AUTHENTICATION_REQUIRED";
  return {
    disposition, canonical, coverage, findings, unresolved, sourceConflicts,
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  };
}
