import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assembleEcoNommoReadOnlySourcesWithClient,
  type EcoNommoSourceAssemblyClient,
} from "./assembleEcoNommoReadOnlySourcesWithClient";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

const at = new Date("2026-11-17T12:00:00.000Z");
const admission: EcoNommoDraftAdmission = {
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01",
  title: "Synthetic draft",
  kind: "GENERAL",
  instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
  custodyReference: "synthetic-source-custody",
  sourceSha256: "ab".repeat(32),
  actorUserId: "actor-1",
  correlationId: "correlation-1",
};
const candidate: EcoNommoMandateEvidenceCandidate = {
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution",
  issuerRepresentativeUserId: "issuer-1",
  representedInstitutionId: "holder-institution",
  holderUserId: "actor-1",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-31T00:00:00.000Z",
  revokedAt: null,
  supersededAt: null,
  evidenceReference: "synthetic-evidence",
  evidenceCustodyReference: "synthetic-mandate-custody",
  evidenceSha256: "cd".repeat(32),
  evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "verifier-reference",
};

function records(options: { holder?: boolean; issuer?: boolean; holderActive?: boolean; issuerActive?: boolean; forgedHolderId?: string; forgedIssuerId?: string } = {}) {
  const reads: string[] = [];
  const holderPresent = options.holder ?? true;
  const issuerPresent = options.issuer ?? true;
  const client = {
    frenchWardInstitutionalParticipant: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        reads.push("holder:" + where.userId);
        if (!holderPresent) return null;
        return {
          userId: options.forgedHolderId ?? "actor-1",
          reference: "fw-holder",
          displayName: "Synthetic Holder",
          institutionalTitle: "Not authority",
          secondaryTitle: null,
          capacityClass: "REPRESENTATIVE",
          recognitionBasis: "DOCUMENTARY",
          provenanceReference: "documentary-only",
          status: options.holderActive === false ? "INACTIVE" : "ACTIVE",
          recognizedAt: at,
          endedAt: options.holderActive === false ? at : null,
        };
      },
    },
    frenchWardGoverningOfficer: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        reads.push("issuer:" + where.userId);
        if (!issuerPresent) return null;
        return {
          userId: options.forgedIssuerId ?? "issuer-1",
          reference: "fw-issuer",
          displayName: "Synthetic Issuer",
          institutionalTitle: "Not delegation",
          secondaryTitle: null,
          governingBasis: "INTERNAL_RECOGNITION",
          provenanceReference: "historical",
          status: options.issuerActive === false ? "INACTIVE" : "ACTIVE",
          recognizedAt: at,
          endedAt: options.issuerActive === false ? at : null,
        };
      },
    },
  } as unknown as EcoNommoSourceAssemblyClient;
  return { client, reads };
}

function assertUnresolved(result: Awaited<ReturnType<typeof assembleEcoNommoReadOnlySourcesWithClient>>) {
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.ok(result.resolution.standing === "SOURCE_INCOMPLETE" ||
    result.resolution.standing === "SOURCE_CONFLICTED");
  assert.equal(result.resolution.operativeAuthorityEstablished, false);
  assert.equal(result.observations.holder, null);
  assert.equal(result.observations.issuer, null);
  assert.equal(result.observations.verifier, null);
  assert.equal(result.observations.mandateEvidence, null);
  assert.equal(result.observations.mandateCurrent, null);
}

test("even active French-Ward participants do not become mandate authority", async () => {
  const { client, reads } = records();
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate, at,
  });
  assert.deepEqual(reads, ["holder:actor-1", "issuer:issuer-1"]);
  assert.deepEqual(result.recognizedStanding, { holder: "ACTIVE", issuer: "ACTIVE" });
  assert.ok(result.sourceWarnings.includes("INSTITUTIONAL_IDENTITY_BINDING_UNQUALIFIED"));
  assertUnresolved(result);
});

test("missing holder recognition does not gain identity from candidate", async () => {
  const { client } = records({ holder: false });
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate, at,
  });
  assert.equal(result.recognizedStanding.holder, "NOT_FOUND");
  assert.ok(result.sourceWarnings.includes("HOLDER_RECOGNITION_NOT_FOUND"));
  assertUnresolved(result);
});

test("inactive holder and issuer are recorded as inactive, never granted", async () => {
  const { client } = records({ holderActive: false, issuerActive: false });
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate, at,
  });
  assert.deepEqual(result.recognizedStanding, { holder: "INACTIVE", issuer: "INACTIVE" });
  assert.ok(result.sourceWarnings.includes("HOLDER_RECOGNITION_INACTIVE"));
  assert.ok(result.sourceWarnings.includes("ISSUER_GOVERNING_RECOGNITION_INACTIVE"));
  assertUnresolved(result);
});

test("missing issuer is not inferred from documentary source", async () => {
  const { client } = records({ issuer: false });
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate, at,
  });
  assert.equal(result.recognizedStanding.issuer, "NOT_FOUND");
  assertUnresolved(result);
});

test("mismatched authenticated actor performs no institutional reads", async () => {
  const { client, reads } = records();
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "different", admission, candidate, at,
  });
  assert.deepEqual(reads, []);
  assert.ok(result.sourceWarnings.includes("VERIFIED_SESSION_ACTOR_NOT_BOUND"));
  assertUnresolved(result);
});

test("missing authenticated actor performs no institutional reads", async () => {
  const { client, reads } = records();
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: null, admission, candidate, at,
  });
  assert.deepEqual(reads, []);
  assert.equal(result.observations.sessionUserId, null);
  assertUnresolved(result);
});

test("unexpected record identity remains an explicit conflict warning", async () => {
  const { client } = records({ forgedHolderId: "other-holder", forgedIssuerId: "other-issuer" });
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate, at,
  });
  assert.ok(result.sourceWarnings.includes("HOLDER_RECORD_IDENTITY_CONFLICT"));
  assert.ok(result.sourceWarnings.includes("ISSUER_RECORD_IDENTITY_CONFLICT"));
  assertUnresolved(result);
});

test("without documentary candidate no issuer lookup occurs", async () => {
  const { client, reads } = records();
  const result = await assembleEcoNommoReadOnlySourcesWithClient({
    client, sessionUserId: "actor-1", admission, candidate: null, at,
  });
  assert.deepEqual(reads, ["holder:actor-1"]);
  assertUnresolved(result);
});

test("read errors propagate rather than masquerade as missing authority", async () => {
  const { client } = records();
  const failing = {
    ...client,
    frenchWardInstitutionalParticipant: {
      findUnique: async () => { throw new Error("SYNTHETIC_READ_FAILURE"); },
    },
  } as unknown as EcoNommoSourceAssemblyClient;
  await assert.rejects(
    assembleEcoNommoReadOnlySourcesWithClient({
      client: failing, sessionUserId: "actor-1", admission, candidate, at,
    }),
    /SYNTHETIC_READ_FAILURE/,
  );
});
