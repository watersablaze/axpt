import { createHash } from 'node:crypto';
import { readFile, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { executeGsamEditionCustody } from './gsamEditionCustodyExecutor.mjs';

const fail = message => { throw new Error(`GSAM_3L5_3_STOP: ${message}`); };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const proposalPath = process.argv[2];
if (!proposalPath || process.argv.length !== 3) fail('usage: node acceptRealEditionCustody.mjs /absolute/path/to/proposal.json');
const proposal = JSON.parse(await readFile(resolve(proposalPath), 'utf8'));
const store = new Map();
let calls = 0;
const preserve = async ({ format, expectedSha256, bytes }) => {
  calls++;
  if (!['pdf', 'html'].includes(format) || digest(bytes) !== expectedSha256) fail('invalid supplied bytes');
  const key = `gsam/sco/sha256/${expectedSha256}.${format}`;
  const old = store.get(key);
  if (old && digest(old) !== expectedSha256) fail('in-memory collision corrupted');
  if (!old) store.set(key, Buffer.from(bytes));
  const readback = store.get(key);
  if (!readback || digest(readback) !== expectedSha256 || readback.byteLength !== bytes.byteLength) fail('in-memory readback integrity');
  return {key, sha256: expectedSha256, disposition: old ? 'exists' : 'created'};
};

const first = await executeGsamEditionCustody({proposal, preserve});
if (first.status !== 'PRESERVED_VERIFIED_TEST_ONLY' || first.artifacts.length !== 4 ||
    first.artifacts.some(x => x.disposition !== 'created' || !x.verified) || store.size !== 4 || calls !== 4) {
  fail(`first pass acceptance failed: ${first.status}, calls=${calls}, keys=${store.size}`);
}
console.log('PASS: four real local artifact bytes verified and preserved in memory');

const repeat = await executeGsamEditionCustody({proposal, preserve});
if (repeat.status !== 'PRESERVED_VERIFIED_TEST_ONLY' || repeat.artifacts.length !== 4 ||
    repeat.artifacts.some(x => x.disposition !== 'exists' || !x.verified) || store.size !== 4 || calls !== 8) {
  fail('repeat idempotency acceptance failed');
}
console.log('PASS: second full run reused four identical in-memory objects');

// One source read is deliberately corrupted. All four files must prevalidate before preserve is called.
const badPath = proposal.artifacts[3].local_custody_file;
let negativeCalls = 0;
let rejected = false;
try {
  await executeGsamEditionCustody({
    proposal,
    readBytes: async path => path === badPath ? Buffer.from('tampered') : readFile(path),
    stat: lstat,
    preserve: async () => { negativeCalls++; throw new Error('UNEXPECTED_PRESERVE'); },
  });
} catch (error) {
  rejected = String(error).includes('GSAM_EDITION_CUSTODY_STOP');
}
if (!rejected || negativeCalls !== 0) fail('corrupted-source rejection did not stop before preserve');
console.log('PASS: corrupted fourth source rejected before any preservation call');

for (const a of first.artifacts) {
  const bytes = store.get(a.object_key);
  if (!bytes || digest(bytes) !== a.sha256 || bytes.byteLength !== a.bytes) fail(`final in-memory integrity ${a.edition_mt}:${a.format}`);
  console.log(`PASS: ${a.edition_mt} MT ${a.format.toUpperCase()} · ${a.bytes} bytes · ${a.sha256}`);
}
console.log('GSAM 3L5.3 ACCEPTED — in-memory only; no S3, network, DB, registry, issuance, or recipient operations');
