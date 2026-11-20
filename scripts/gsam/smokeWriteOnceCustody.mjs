import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { preserveGsamWriteOnceArtifact, GsamCustodyError } = await import(pathToFileURL(resolve('src/domains/instruments/transaction-documents/gsamWriteOnceCustody.ts')).href);
const hash = b => createHash('sha256').update(b).digest('hex');
let checked = 0;
async function rejects(fn, reason) {
  await assert.rejects(fn, e => e instanceof GsamCustodyError && e.reason === reason);
  checked++;
}
for (const [format, bytes] of [
  ['pdf', Buffer.from('%PDF-1.4\n%synthetic test document\n')],
  ['html', Buffer.from('<!doctype html><html><body>synthetic</body></html>')],
]) {
  const data = new Map();
  const store = {
    async putIfAbsent(key, value) {
      if (data.has(key)) return 'exists';
      data.set(key, Uint8Array.from(value));
      return 'created';
    },
    async read(key) { return Uint8Array.from(data.get(key)); },
  };
  const expectedSha256 = hash(bytes);
  const args = { store, format, bytes, expectedSha256 };
  const first = await preserveGsamWriteOnceArtifact(args);
  assert.equal(first.disposition, 'created'); checked++;
  const second = await preserveGsamWriteOnceArtifact(args);
  assert.equal(second.disposition, 'exists'); checked++;
  assert.equal(data.size, 1); checked++;
  await rejects(() => preserveGsamWriteOnceArtifact({ ...args, expectedSha256: '0'.repeat(64) }), 'INVALID_ARTIFACT');
  await rejects(() => preserveGsamWriteOnceArtifact({ ...args, bytes: Buffer.from('not a document') }), 'INVALID_ARTIFACT');
  data.set(first.key, Buffer.from('tampered'));
  await rejects(() => preserveGsamWriteOnceArtifact(args), 'HASH_MISMATCH');
  data.set(first.key, bytes);
  await rejects(() => preserveGsamWriteOnceArtifact({ ...args, store: { ...store, async putIfAbsent() { throw new GsamCustodyError('CONDITIONAL_WRITE_UNSUPPORTED'); } } }), 'CONDITIONAL_WRITE_UNSUPPORTED');
  await rejects(() => preserveGsamWriteOnceArtifact({ ...args, store: { ...store, async read() { throw new Error('read'); } } }), 'READ_FAILED');
  console.log(`PASS: ${format} write-once, idempotency, collision integrity, fail-closed`);
}
console.log(`3L4C synthetic acceptance: ${checked} checks; no network, database or credentials`);
