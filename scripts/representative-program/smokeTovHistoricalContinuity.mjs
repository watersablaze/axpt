import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        specifier.startsWith(".") &&
        !/\.[a-z]+$/i.test(specifier)
      ) {
        return nextResolve(specifier + ".ts", context);
      }
      throw error;
    }
  },
});

const domain =
  "../../src/domains/institutions/french-ward/";

const commercial =
  "../../src/domains/instruments/" +
  "representative-program/commercial-utility-pack/" +
  "commercial-papers/";

const { TOV_PUBLICATION_LEGACY: legacy } =
  await import(domain + "tovPublicationLegacy.ts");

const { TOV_PUBLICATION_REVISION_02: revision02 } =
  await import(domain + "tovPublicationRevision02.ts");

const { TOV_PUBLICATION_REVISION_03: revision03 } =
  await import(domain + "tovPublicationRevision03.ts");

const { TOV_PUBLICATION: revision04 } =
  await import(domain + "tovPublication.ts");

const {
  resolveTovPublication,
  createTovCopyPin,
  renderTovRepresentativeCopy,
} = await import(domain + "tovRepresentativeCopy.ts");

const {
  commercialPapers,
  commercialPaperMetadata,
  commercialPaperPinMatches,
} = await import(commercial + "catalog.ts");

const hash = value =>
  createHash("sha256").update(value).digest("hex");

const paper = commercialPapers().find(
  entry => entry.key === "TRANSACTION_OVERVIEW"
);

assert(paper, "Current TOV catalog entry required");

const artifacts = [
  [1, legacy],
  [2, revision02],
  [3, revision03],
  [4, revision04],
];

for (const [revision, artifact] of artifacts) {
  assert.equal(
    hash(artifact.html),
    artifact.publicationHash,
    `Revision ${revision}: immutable HTML hash`
  );

  const metadata = commercialPaperMetadata(paper);

  metadata.commercialPaper.contentHash =
    artifact.contentHash;

  metadata.commercialPaper.publicationHash =
    artifact.publicationHash;

  const resolved = resolveTovPublication(metadata);

  assert(resolved, `Revision ${revision} resolves`);
  assert.equal(resolved.publicationHash, artifact.publicationHash);
  assert.equal(resolved.html, artifact.html);
  assert.equal(resolved.publicationRevision, revision);

  assert.equal(
    commercialPaperPinMatches(metadata, paper),
    true,
    `Revision ${revision}: catalog pin acceptance`
  );

  const badContent = structuredClone(metadata);
  badContent.commercialPaper.contentHash = "0".repeat(64);

  assert.equal(
    commercialPaperPinMatches(badContent, paper),
    false,
    `Revision ${revision}: content drift rejected`
  );

  const badPublication = structuredClone(metadata);
  badPublication.commercialPaper.publicationHash =
    "f".repeat(64);

  assert.equal(
    resolveTovPublication(badPublication),
    null,
    `Revision ${revision}: unknown hash rejected`
  );

  assert.equal(
    commercialPaperPinMatches(badPublication, paper),
    false
  );

  console.log(`PASS: TOV revision ${revision}`);
}

const copy = createTovCopyPin({
  resourceReleaseId: "resource-001",
  participantId: "participant-001",
  representativeUserId: "representative-001",
  displayName: "Test Representative",
});

const copyMetadata = commercialPaperMetadata(paper);
copyMetadata.tovRepresentativeCopy = copy;

const resolvedCopy = resolveTovPublication(copyMetadata);

assert(resolvedCopy);
assert.equal(
  resolvedCopy.html,
  renderTovRepresentativeCopy("Test Representative", 4)
);
assert.equal(resolvedCopy.publicationHash, copy.publicationHash);

const tamperedCopy = structuredClone(copyMetadata);
tamperedCopy.tovRepresentativeCopy.displayName =
  "Different Representative";

assert.equal(resolveTovPublication(tamperedCopy), null);

const tamperedHash = structuredClone(copyMetadata);
tamperedHash.tovRepresentativeCopy.publicationHash =
  "0".repeat(64);

assert.equal(resolveTovPublication(tamperedHash), null);

console.log(
  "TOV_HISTORICAL_CONTINUITY_OK: four revisions, " +
  "immutable hashes, exact resolution, invalid-pin " +
  "denial, representative-copy integrity."
);
