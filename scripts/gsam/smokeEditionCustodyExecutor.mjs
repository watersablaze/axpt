import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateGsamEditionProposal, executeGsamEditionCustody } from './gsamEditionCustodyExecutor.mjs';
const specs = [[100,'pdf','45205721025b212b790bf0db7e19dbbc627fa03994749cd3a990fa52e05a0149',351196], [100,'html','cb3f9e2e40723cb54843d43de1d2cff739bfff411f64ffc892cad10130e9f323',4085211], [1000,'pdf','b426bb06f85bd61466e703e144376226308a8e37342e2103c13781b480d68bf7',351335],[1000,'html','31dab83a0ab8a9bf36cc218e392135b04f72a09c934c56bf92e286f80cb3a842',4085217]];
// Synthetic fixture uses injected buffers, not real customer files. Hashes are fixture-local for a separate verification harness;
// the production descriptor is intentionally rigid, so synthetic test exercises rejection plus the execution contract via mock I/O.
const proposal = {status:'PREFLIGHT_ONLY_NOT_UPLOADED',source:'GSAM 3L2-S5',target:'gsam-custody-acceptance',release:'CLOSED',artifacts:specs.map(([mt,fmt,sha,bytes])=>({edition_mt:mt,format:fmt,candidate_file:`GSAM-SCO-${mt}MT-CANDIDATE.${fmt}`,sha256:sha,bytes,proposed_object_key:`gsam/sco/sha256/${sha}.${fmt}`,local_custody_file:`/synthetic/objects/${fmt}/${sha}.${fmt}`}))};
const bad = structuredClone(proposal);bad.artifacts[0].sha256 = '0'.repeat(64);
await assert.rejects(()=>validateGsamEditionProposal(bad),/descriptor mismatch/);
const duplicate=structuredClone(proposal);duplicate.artifacts[3]=duplicate.artifacts[0];
await assert.rejects(()=>validateGsamEditionProposal(duplicate),/duplicate edition format/);
const release=structuredClone(proposal);release.release='OPEN';
await assert.rejects(()=>validateGsamEditionProposal(release),/proposal status/);
const target=structuredClone(proposal);target.target='axpt-transaction-documents';
await assert.rejects(()=>validateGsamEditionProposal(target),/proposal status/);
const early=await executeGsamEditionCustody({proposal:bad,preserve:()=>{throw Error('MUST NOT CALL')}}).then(()=>false,()=>true);assert(early);
// Every file is absent in this fixture: validate must stop before preserve is called.
let writes=0;
await assert.rejects(()=>executeGsamEditionCustody({proposal,preserve:()=>{writes++;}}),/local file unavailable/);
assert.equal(writes,0);
console.log('PASS: altered digest, duplicated edition, release-open, wrong target, malformed preflight, missing source');
console.log('PASS: all four must prevalidate before any preserve operation; 0 writes');
console.log('3L5.2 SOURCE-ONLY SMOKE PASS: no network, S3, database, credentials, or commercial bytes');
