import { createHash } from 'node:crypto';

const HASH = /^[0-9a-f]{64}$/;
const KEY_PREFIX = 'gsam/sco/sha256/';
const FORMATS = ['pdf', 'html'];
const QUANTITIES = [100, 1000];

export class GsamReconciliationError extends Error {
  constructor(code) {
    super(`GSAM reconciliation rejected: ${code}`);
    this.name = 'GsamReconciliationError';
    this.code = code;
  }
}

function requireCondition(ok, code) {
  if (!ok) throw new GsamReconciliationError(code);
}

function keyFor(hash, format) {
  return `${KEY_PREFIX}${hash}.${format}`;
}

// Receipt is an INPUT to validate, not proof that any provider was contacted.
// Caller must independently authenticate custody evidence and verify provider bytes.
export function reconcileGsamCandidateEditions({ editions, receipt, sourceSha256 }) {
  requireCondition(Array.isArray(editions) && editions.length === 2, 'EDITION_COUNT');
  requireCondition(Array.isArray(receipt?.artifacts) && receipt.artifacts.length === 4, 'RECEIPT_COUNT');
  requireCondition(HASH.test(sourceSha256), 'SOURCE_DIGEST');
  requireCondition(receipt.status === 'VERIFIED_CUSTODY', 'RECEIPT_NOT_VERIFIED');
  requireCondition(receipt.release === 'CLOSED', 'RELEASE_OPEN');
  requireCondition(typeof receipt.bucket === 'string' && receipt.bucket.length > 0, 'BUCKET_REQUIRED');

  const editionsByQuantity = new Map();
  for (const edition of editions) {
    requireCondition(QUANTITIES.includes(edition?.quantityMt), 'EDITION_QUANTITY');
    requireCondition(!editionsByQuantity.has(edition.quantityMt), 'DUPLICATE_EDITION');
    requireCondition(edition.state === 'CANDIDATE', 'NON_CANDIDATE');
    requireCondition(typeof edition.reference === 'string' && edition.reference.length > 0, 'REFERENCE');
    requireCondition(edition.sourceSha256 === sourceSha256, 'SOURCE_MISMATCH');
    requireCondition(HASH.test(edition.pdfSha256) && HASH.test(edition.htmlSha256), 'EDITION_HASH');
    editionsByQuantity.set(edition.quantityMt, edition);
  }

  const artifacts = new Map();
  for (const artifact of receipt.artifacts) {
    requireCondition(QUANTITIES.includes(artifact?.edition_mt), 'RECEIPT_QUANTITY');
    requireCondition(FORMATS.includes(artifact.format), 'RECEIPT_FORMAT');
    const id = `${artifact.edition_mt}:${artifact.format}`;
    requireCondition(!artifacts.has(id), 'DUPLICATE_ARTIFACT');
    requireCondition(HASH.test(artifact.sha256), 'ARTIFACT_HASH');
    requireCondition(artifact.object_key === keyFor(artifact.sha256, artifact.format), 'OBJECT_KEY');
    requireCondition(Number.isSafeInteger(artifact.bytes) && artifact.bytes > 0, 'ARTIFACT_SIZE');
    requireCondition(artifact.verified_sha256 === artifact.sha256, 'READBACK_NOT_VERIFIED');
    artifacts.set(id, artifact);
  }

  const bindings = [];
  for (const quantity of QUANTITIES) {
    const edition = editionsByQuantity.get(quantity);
    requireCondition(Boolean(edition), 'MISSING_EDITION');
    for (const format of FORMATS) {
      const artifact = artifacts.get(`${quantity}:${format}`);
      requireCondition(Boolean(artifact), 'MISSING_ARTIFACT');
      const digest = edition[`${format}Sha256`];
      const storageKey = edition[`${format}StorageKey`];
      requireCondition(artifact.sha256 === digest, 'EDITION_ARTIFACT_MISMATCH');
      requireCondition(storageKey == null || storageKey === artifact.object_key, 'REGISTRY_KEY_CONFLICT');
      bindings.push(Object.freeze({
        editionReference: edition.reference,
        quantityMt: quantity,
        format,
        sha256: digest,
        proposedStorageKey: artifact.object_key,
        registryAlreadyBound: storageKey === artifact.object_key,
      }));
    }
  }
  return Object.freeze({
    status: 'RECONCILED_FOR_REVIEW_ONLY',
    bucket: receipt.bucket,
    release: 'CLOSED',
    bindings: Object.freeze(bindings),
    // A stable digest of validated binding metadata, not an attestation of S3 custody.
    bindingDigest: createHash('sha256').update(JSON.stringify(bindings)).digest('hex'),
  });
}
