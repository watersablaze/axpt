import assert from 'node:assert/strict';
import { reconcileGsamCandidateEditions, GsamReconciliationError } from './gsamEditionReconciliation.mjs';
const h = (ch) => ch.repeat(64);
const sourceSha256 = h('a');
const editions = [100,1000].map((quantityMt, i) => ({
  reference: `GSAM-SCO-${quantityMt}MT-CANDIDATE`,quantityMt,state:'CANDIDATE',sourceSha256,
  pdfSha256:h(i?'3':'1'),htmlSha256:h(i?'4':'2'),pdfStorageKey:null,htmlStorageKey:null,
}));
const artifacts = editions.flatMap(e => ['pdf','html'].map(format => ({
  edition_mt:e.quantityMt,format,sha256:e[`${format}Sha256`],
  object_key:`gsam/sco/sha256/${e[`${format}Sha256`]}.${format}`,
  verified_sha256:e[`${format}Sha256`],bytes:format==='pdf'?300:4000,
})));
const receipt = {status:'VERIFIED_CUSTODY',release:'CLOSED',bucket:'isolated-synthetic',artifacts};
const accept = reconcileGsamCandidateEditions({editions,receipt,sourceSha256});
assert.equal(accept.bindings.length,4);
assert.equal(accept.status,'RECONCILED_FOR_REVIEW_ONLY');
assert.equal(accept.bindings.filter(x=>x.registryAlreadyBound).length,0);
const bound = structuredClone(editions);
bound[0].pdfStorageKey = artifacts[0].object_key;
assert.equal(reconcileGsamCandidateEditions({editions:bound,receipt,sourceSha256}).bindings.filter(x=>x.registryAlreadyBound).length,1);
let rejectionCount=0;
function reject(mutator,code){const e=structuredClone(editions);const r=structuredClone(receipt);const context={editions:e,receipt:r,sourceSha256};mutator(context);assert.throws(()=>reconcileGsamCandidateEditions(context),x=>x instanceof GsamReconciliationError&&x.code===code,code);rejectionCount++;}
reject(x=>{x.receipt.status='PREFLIGHT_ONLY_NOT_UPLOADED'},'RECEIPT_NOT_VERIFIED');
reject(x=>{x.receipt.release='OPEN'},'RELEASE_OPEN');
reject(x=>{x.editions[0].state='ISSUED'},'NON_CANDIDATE');
reject(x=>{x.editions[1].quantityMt=100},'DUPLICATE_EDITION');
reject(x=>{x.editions[0].sourceSha256=h('f')},'SOURCE_MISMATCH');
reject(x=>{x.receipt.artifacts[0].sha256=h('e')},'OBJECT_KEY');
reject(x=>{x.receipt.artifacts[0].verified_sha256=h('e')},'READBACK_NOT_VERIFIED');
reject(x=>{x.receipt.artifacts[3].bytes=0},'ARTIFACT_SIZE');
reject(x=>{x.receipt.artifacts.push(structuredClone(x.receipt.artifacts[0]))},'RECEIPT_COUNT');
reject(x=>{x.receipt.artifacts[3]=structuredClone(x.receipt.artifacts[0])},'DUPLICATE_ARTIFACT');
reject(x=>{x.editions[0].pdfStorageKey='different/key.pdf'},'REGISTRY_KEY_CONFLICT');
reject(x=>{x.receipt.artifacts[0].sha256=h('e');x.receipt.artifacts[0].verified_sha256=h('e');x.receipt.artifacts[0].object_key=`gsam/sco/sha256/${h('e')}.pdf`},'EDITION_ARTIFACT_MISMATCH');
console.log(`PASS: 4 synthetic bindings, prebound-key reconciliation, ${rejectionCount} fail-closed cases`);
console.log('GSAM 3L6B SOURCE-ONLY PASS — no storage, database, credentials, migrations or recipient activity');
