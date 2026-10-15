import assert from 'node:assert/strict';
import { resolveBuyerDossierSelection } from '../../src/domains/instruments/representative-program/commercial-utility-pack/application/resolveBuyerDossierSelection.ts';
const profile = {resourceReleaseId:'profile',kind:'INSTITUTIONAL_PROFILE',reference:'FW-PROFILE',version:2,label:'Profile',recipientContentHash:'a'.repeat(64)};
const source = {resourceReleaseId:'source',kind:'SOURCE_AUTHORITY',reference:'BAF-SAI',version:1,label:'Source Authority',recipientContentHash:'b'.repeat(64)};
const records = new Map([['profile',profile],['source',source]]);
const ports = {loadPublication:async id=>records.get(id) ?? null,authorizeIntroductionAndTransmission:async()=>true};
const resolve = (ids, overrides={})=>resolveBuyerDossierSelection({resourceReleaseIds:ids,ports:{...ports,...overrides}});
const first=await resolve(['profile','source']);
assert.equal(first.allowed,true);
assert.equal(first.publications.length,2);
assert.equal(first.establishesRecipientAccess,false);
assert.equal(first.establishesDownloadPermission,false);
assert.equal((await resolve(['source','profile'])).reviewHash,first.reviewHash);
assert.equal((await resolve(['profile'])).allowed,true);
assert.equal((await resolve(['source'])).allowed,true);
for(const selection of [[],['profile','profile'],['profile','source','other'],[' profile'],['agreement']]) {
  assert.equal((await resolve(selection)).allowed,false);
}
assert.equal((await resolve(['profile','source'],{authorizeIntroductionAndTransmission:async p=>p.kind!=='SOURCE_AUTHORITY'})).allowed,false);
source.version=2;
assert.notEqual((await resolve(['profile','source'])).reviewHash,first.reviewHash);
source.recipientContentHash='c'.repeat(64);
const revised=await resolve(['profile','source']);
source.recipientContentHash='d'.repeat(64);
assert.notEqual((await resolve(['profile','source'])).reviewHash,revised.reviewHash);
assert.equal((await resolve(['profile'],{loadPublication:async()=>({...profile,resourceReleaseId:'other'})})).allowed,false);
assert.equal((await resolve(['profile','source'],{loadPublication:async id=>({...profile,resourceReleaseId:id})})).allowed,false);
await assert.rejects(resolve(['source'],{loadPublication:async()=>{throw new Error('DATABASE_UNAVAILABLE')}}));
console.log('BUYER_DOSSIER_SELECTION_OK: atomic selection, per-material authorization, identity, edition/content binding, stable order, and no implied access/download grants.');
