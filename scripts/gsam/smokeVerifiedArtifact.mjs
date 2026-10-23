import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const file = resolve(process.cwd(), 'src/domains/instruments/transaction-documents/gsamVerifiedArtifact.ts');
const {readVerifiedGsamArtifact, GsamArtifactVerificationError} = await import(pathToFileURL(file).href);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const html = Buffer.from('<!DOCTYPE html><html lang="en"><body>Fixture</body></html>');
const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(25_000, 42)]);
for (const [kind, bytes] of [['html', html], ['pdf', pdf]]) {
  const sha256 = digest(bytes);
  const key = `gsam-sco/sha256/${sha256}.${kind}`;
  const reader = {async read(received) {assert.equal(received, key); return bytes;}};
  const verified = await readVerifiedGsamArtifact(reader, {key,sha256,kind});
  assert.equal(digest(verified.bytes), sha256);
  assert.equal(verified.sha256, sha256);
  const rejects = async (r, d, reason) => assert.rejects(
    () => readVerifiedGsamArtifact(r, d),
    e => e instanceof GsamArtifactVerificationError && e.reason === reason,
  );
  await rejects(reader, {key:`gsam-sco/sha256/${'a'.repeat(64)}.${kind}`,sha256,kind}, 'INVALID_DESCRIPTOR');
  await rejects(reader, {key:'../secret',sha256,kind}, 'INVALID_DESCRIPTOR');
  await rejects({read:async()=>{throw new Error('403')}}, {key,sha256,kind}, 'READ_FAILED');
  await rejects({read:async()=>Buffer.from(bytes).fill(0)}, {key,sha256,kind}, 'HASH_MISMATCH');
  await rejects({read:async()=>new Uint8Array()}, {key,sha256,kind}, 'INVALID_BYTES');
  const malformed = kind === 'pdf' ? Buffer.alloc(25_000, 65) : Buffer.from('<html>missing doctype</html>');
  const badHash = digest(malformed);
  await rejects({read:async()=>malformed}, {key:`${badHash}.${kind}`,sha256:badHash,kind}, 'INVALID_BYTES');
  console.log(`PASS: ${kind} verified read and six fail-closed tests`);
}
console.log('3L4B PASS: no network, database, credentials, issuance or recipient operations');
