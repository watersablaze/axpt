import { createHash } from 'node:crypto';
import { readFile, lstat } from 'node:fs/promises';

const EXPECTED = Object.freeze([
  [100, 'pdf', '45205721025b212b790bf0db7e19dbbc627fa03994749cd3a990fa52e05a0149', 351196],
  [100, 'html', 'cb3f9e2e40723cb54843d43de1d2cff739bfff411f64ffc892cad10130e9f323', 4085211],
  [1000, 'pdf', 'b426bb06f85bd61466e703e144376226308a8e37342e2103c13781b480d68bf7', 351335],
  [1000, 'html', '31dab83a0ab8a9bf36cc218e392135b04f72a09c934c56bf92e286f80cb3a842', 4085217],
]);
const hash = b => createHash('sha256').update(b).digest('hex');
const fail = m => { throw new Error(`GSAM_EDITION_CUSTODY_STOP: ${m}`); };

/** Full prevalidation occurs BEFORE the first preserve callback. Never reads storage credentials. */
export async function validateGsamEditionProposal(proposal, readBytes = readFile, stat = lstat) {
  if (!proposal || proposal.status !== 'PREFLIGHT_ONLY_NOT_UPLOADED' ||
      proposal.source !== 'GSAM 3L2-S5' || proposal.target !== 'gsam-custody-acceptance' ||
      proposal.release !== 'CLOSED' || !Array.isArray(proposal.artifacts) || proposal.artifacts.length !== 4) {
    fail('proposal status, target, release, or cardinality');
  }
  const observed = new Set();
  const validated = [];
  for (const entry of proposal.artifacts) {
    if (!entry || typeof entry !== 'object') fail('malformed artifact');
    const tuple = EXPECTED.find(([mt,fmt]) => entry.edition_mt === mt && entry.format === fmt);
    if (!tuple) fail('unexpected edition or format');
    const [mt, fmt, sha, count] = tuple;
    const id = `${mt}:${fmt}`;
    if (observed.has(id)) fail('duplicate edition format');
    observed.add(id);
    const key = `gsam/sco/sha256/${sha}.${fmt}`;
    const filename = `GSAM-SCO-${mt}MT-CANDIDATE.${fmt}`;
    if (entry.candidate_file !== filename || entry.sha256 !== sha || entry.bytes !== count ||
        entry.proposed_object_key !== key || typeof entry.local_custody_file !== 'string' ||
        !entry.local_custody_file.endsWith(`/objects/${fmt}/${sha}.${fmt}`)) fail(`descriptor mismatch ${id}`);
    validated.push({ edition_mt: mt, format: fmt, sha256: sha, object_key: key, size: count, path: entry.local_custody_file });
  }
  if (observed.size !== 4) fail('missing edition');
  for (const item of validated) {
    const { edition_mt: mt, format: fmt, sha256: sha, size: count, path } = item;
    const id = `${mt}:${fmt}`;
    const st = await stat(path).catch(() => fail(`local file unavailable ${id}`));
    if (!st.isFile() || st.isSymbolicLink() || st.size !== count) fail(`local file metadata mismatch ${id}`);
    const bytes = await readBytes(path).catch(() => fail(`local read failed ${id}`));
    if (!(bytes instanceof Uint8Array) || bytes.byteLength !== count || hash(bytes) !== sha) fail(`bytes mismatch ${id}`);
    if (fmt === 'pdf' && Buffer.from(bytes.subarray(0,5)).toString('ascii') !== '%PDF-') fail(`pdf header ${id}`);
    if (fmt === 'html' && !/^\s*<!doctype html/i.test(Buffer.from(bytes.subarray(0,256)).toString('utf8'))) fail(`html doctype ${id}`);
    item.bytes = bytes;
  }
  return validated;
}

/** Injectable side-effect boundary. The caller, not this module, controls access to storage. */
export async function executeGsamEditionCustody({ proposal, preserve, readBytes, stat }) {
  if (typeof preserve !== 'function') fail('missing preservation adapter');
  const validated = await validateGsamEditionProposal(proposal, readBytes, stat);
  const receipt = { schema: 'GSAM_3L5_2_CUSTODY_ATTEMPT_V1', target: 'gsam-custody-acceptance', release: 'CLOSED',
    registry_mutated: false, artifacts: [], status: 'INCOMPLETE' };
  for (const artifact of validated) {
    try {
      const result = await preserve({format: artifact.format, expectedSha256: artifact.sha256, bytes: artifact.bytes});
      if (!result || result.key !== artifact.object_key || result.sha256 !== artifact.sha256 ||
          !['created', 'exists'].includes(result.disposition)) fail(`invalid preserve result ${artifact.edition_mt}:${artifact.format}`);
      receipt.artifacts.push({ edition_mt: artifact.edition_mt, format: artifact.format, sha256: artifact.sha256,
        bytes: artifact.size, object_key: artifact.object_key, disposition: result.disposition, verified: true });
    } catch (error) {
      receipt.status = 'FAILED_PARTIAL_POSSIBLE';
      receipt.error = String(error instanceof Error ? error.message : 'unknown failure');
      return receipt;
    }
  }
  receipt.status = 'PRESERVED_VERIFIED_TEST_ONLY';
  return receipt;
}
