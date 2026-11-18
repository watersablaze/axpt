/**
 * ECN-REG-1C.2D.4A — READ-ONLY SOURCE COVERAGE HARNESS.
 *
 * Exercises actual existing French-Ward recognition read models with an
 * injected client, and compares optional *untrusted synthetic observations*
 * using the accepted negative-only contracts. It never promotes supplied
 * claims into trusted facts. Not connected to a route or write operation.
 *
 * This is a coverage inventory, NOT an authenticated mandate resolver.
 */
import { assembleEcoNommoReadOnlySourcesWithClient, type EcoNommoSourceAssemblyClient } from "./assembleEcoNommoReadOnlySourcesWithClient";
import { assessInstitutionalDelegationIdentityBinding, type InstitutionalDelegationIdentitySources } from "./assessInstitutionalDelegationIdentityBinding";
import { assessIndependentMandateEvidence, type MandateEvidenceAuthenticationSources } from "./assessIndependentMandateEvidence";
import { assessEcoNommoMandateCurrentness, type MandateCurrentnessSnapshot } from "./assessEcoNommoMandateCurrentness";
import { assessEcoNommoDelegationProvenance, type DelegationProvenanceClaim } from "./assessEcoNommoDelegationProvenance";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

type ScopedAdmission = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" | "sourceReference" |
  "sourceEdition" | "instrumentStatus" | "versionStatus">;
export type EcoNommoCoverageKey =
  | "ISSUER_COMPETENCE" | "INSTITUTIONAL_BINDINGS" | "DOCUMENT_SCOPE"
  | "CUSTODY_DIGEST" | "INDEPENDENT_VERIFIER" | "MANDATE_CURRENTNESS"
  | "DURABLE_PROVENANCE";
export type EcoNommoCoverageFinding = Readonly<{
  key: EcoNommoCoverageKey;
  source: string;
  coverage: "STRUCTURAL_ONLY" | "UNQUALIFIED" | "MISSING";
  gaps: readonly string[];
  authenticated: false;
}>;
export type EcoNommoSourceCoverageReport = Readonly<{
  findings: readonly EcoNommoCoverageFinding[];
  sourceWarnings: readonly string[];
  decisions: Readonly<{
    recognition: string;
    identities: string;
    evidence: string;
    currentness: string;
    provenance: string;
  }>;
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

/** All non-DB observations are explicitly untrusted input, even in tests. */
export async function inspectEcoNommoSourceCoverageWithClient(params: Readonly<{
  client: EcoNommoSourceAssemblyClient;
  sessionUserId: string | null;
  admission: ScopedAdmission;
  candidate: EcoNommoMandateEvidenceCandidate | null | undefined;
  at: Date;
  identityObservations?: InstitutionalDelegationIdentitySources | null;
  evidenceObservations?: MandateEvidenceAuthenticationSources | null;
  currentnessSnapshot?: MandateCurrentnessSnapshot | null;
  provenanceClaim?: DelegationProvenanceClaim | null;
}>): Promise<EcoNommoSourceCoverageReport> {
  const recognition = await assembleEcoNommoReadOnlySourcesWithClient({
    client: params.client, sessionUserId: params.sessionUserId,
    admission: params.admission, candidate: params.candidate, at: params.at,
  });
  const identities = assessInstitutionalDelegationIdentityBinding(
    params.admission, params.candidate, params.identityObservations ?? null,
  );
  const evidence = assessIndependentMandateEvidence(
    params.candidate, params.evidenceObservations ?? null, params.at,
  );
  const currentness = assessEcoNommoMandateCurrentness(
    params.candidate, params.currentnessSnapshot ?? null, params.at,
  );
  const provenance = assessEcoNommoDelegationProvenance(
    params.admission, params.candidate, params.provenanceClaim ?? null, params.at,
  );
  const sourceBound = recognition.sourceWarnings.includes("VERIFIED_SESSION_ACTOR_NOT_BOUND");
  const recognized = recognition.recognizedStanding.holder === "ACTIVE" &&
    recognition.recognizedStanding.issuer === "ACTIVE";
  const findings: EcoNommoCoverageFinding[] = [
    { key: "ISSUER_COMPETENCE", source: "InstrumentAuthority + issuer recognition",
      coverage: "UNQUALIFIED", gaps: ["INDEPENDENT_ISSUER_COMPETENCE_AUTHENTICATION"], authenticated: false },
    { key: "INSTITUTIONAL_BINDINGS", source: "FrenchWardInstitutionalParticipant + FrenchWardGoverningOfficer",
      coverage: sourceBound || !recognized ? "MISSING" : "STRUCTURAL_ONLY",
      gaps: ["CANONICAL_INSTITUTION_ID_BINDING", "AUTHENTICATED_DELEGATION"],
      authenticated: false },
    { key: "DOCUMENT_SCOPE", source: "Eco-Nommo admission and documentary mandate contracts",
      coverage: "STRUCTURAL_ONLY", gaps: ["SCOPE_BOUND_TO_AUTHENTICATED_MANDATE"],
      authenticated: false },
    { key: "CUSTODY_DIGEST", source: "InstrumentEvidence URI/contentHash/recordedByUserId",
      coverage: "UNQUALIFIED", gaps: ["TRUSTED_CUSTODY_READ", "INDEPENDENT_DIGEST_RECOMPUTATION"],
      authenticated: false },
    { key: "INDEPENDENT_VERIFIER", source: "User + InstrumentEvidence",
      coverage: "MISSING", gaps: ["QUALIFIED_VERIFIER_IDENTITY_AND_COMPETENCE", "INDEPENDENCE_ATTESTATION"],
      authenticated: false },
    { key: "MANDATE_CURRENTNESS", source: "InstrumentAuthority dates/revocation + SourceAuthorityRecognition supersession",
      coverage: "UNQUALIFIED", gaps: ["EXHAUSTIVE_CANONICAL_MANDATE_READ", "WITHDRAWAL_SUSPENSION_SUPERSESSION_BINDING"],
      authenticated: false },
    { key: "DURABLE_PROVENANCE", source: "InstrumentEvidence + DomainEvent + recognition evidence links",
      coverage: "UNQUALIFIED", gaps: ["AUTHENTICATED_SEVEN_FINDING_SOURCE_CHAIN"],
      authenticated: false },
  ];
  return {
    findings, sourceWarnings: recognition.sourceWarnings,
    decisions: {
      recognition: recognition.resolution.standing,
      identities: identities.standing,
      evidence: evidence.standing,
      currentness: currentness.standing,
      provenance: provenance.standing,
    },
    operativeAuthorityEstablished: false,
    admissionAuthorized: false,
  };
}
