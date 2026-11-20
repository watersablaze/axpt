import assert from "node:assert/strict";
import { resolveBuyerDossierSelection } from
  "../../src/domains/instruments/representative-program/commercial-utility-pack/application/resolveBuyerDossierSelection.ts";

const kinds = [
  "TRANSACTION_OVERVIEW",
  "INSTITUTIONAL_PROFILE",
  "SOURCE_AUTHORITY",
  "DECLARATION_OF_TRUST",
  "RESELLER_AGREEMENT",
  "SANCTIONS_SCREENING",
];

const publications = kinds.map((kind, index) => ({
  resourceReleaseId: `release-${index + 1}`,
  kind,
  reference: `TEST-RESOURCE-${index + 1}`,
  version: 1,
  label: `Test publication ${index + 1}`,
  recipientContentHash: (index + 1).toString(16).padStart(64, "0"),
}));

const byId = new Map(
  publications.map(publication => [
    publication.resourceReleaseId,
    publication,
  ])
);

const ids = publications.map(item => item.resourceReleaseId);

function resolve(selection, overrides = {}) {
  return resolveBuyerDossierSelection({
    resourceReleaseIds: selection,
    ports: {
      loadPublication: async id => byId.get(id) ?? null,
      authorizeIntroductionAndTransmission: async () => true,
      ...overrides,
    },
  });
}

const six = await resolve(ids);
assert.equal(six.allowed, true);
assert.equal(six.publications.length, 6);
assert.equal(six.establishesRecipientAccess, false);
assert.equal(six.establishesDownloadPermission, false);

const reordered = await resolve([...ids].reverse());
assert.equal(reordered.allowed, true);
assert.equal(reordered.reviewHash, six.reviewHash);

const seven = await resolve([...ids, "release-7"]);
assert.equal(seven.allowed, false);
assert.equal(seven.reason, "INVALID_SELECTION");

const duplicate = await resolve([...ids.slice(0, 5), ids[0]]);
assert.equal(duplicate.allowed, false);
assert.equal(duplicate.reason, "INVALID_SELECTION");

const unauthorized = await resolve(ids, {
  authorizeIntroductionAndTransmission: async publication =>
    publication.kind !== "TRANSACTION_OVERVIEW",
});
assert.equal(unauthorized.allowed, false);
assert.equal(unauthorized.reason, "SHARING_NOT_AUTHORIZED");

const contradictory = await resolve(ids, {
  loadPublication: async id => {
    const original = byId.get(id);
    return original
      ? {
          ...original,
          reference: "DUPLICATE-REFERENCE",
        }
      : null;
  },
});
assert.equal(contradictory.allowed, false);
assert.equal(contradictory.reason, "PUBLICATION_CONTRADICTION");

const missing = await resolve(ids, {
  loadPublication: async id =>
    id === "release-6" ? null : byId.get(id) ?? null,
});
assert.equal(missing.allowed, false);
assert.equal(missing.reason, "PUBLICATION_UNAVAILABLE");

console.log("BUYER_DOSSIER_SIX_PUBLICATIONS_OK");
console.log("six_authorized=PASS");
console.log("deterministic_hash=PASS");
console.log("seven_rejected=PASS");
console.log("duplicates_rejected=PASS");
console.log("unauthorized_rejected=PASS");
console.log("contradictions_rejected=PASS");
console.log("missing_publication_rejected=PASS");
console.log("recipient_access_not_granted=PASS");
