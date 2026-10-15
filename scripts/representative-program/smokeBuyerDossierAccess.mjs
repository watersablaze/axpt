import assert from 'node:assert/strict';
import { buyerDossierIdentityAllowsAccess, buyerDossierItemAllowsAccess } from '../../src/domains/instruments/representative-program/commercial-utility-pack/application/buyerDossierAccessPolicy.ts';
const at=new Date('2026-10-15T12:00:00Z');
const dossier={recipientUserId:'buyer',recipientEmail:'buyer@example.invalid',recipient:{email:'buyer@example.invalid'},expiresAt:new Date(at.getTime()+60000),revokedAt:null};
const item={kind:'SOURCE_AUTHORITY',grantId:'grant',resourceReference:'BAF-SAI',resourceVersion:1,recipientContentHash:'a'.repeat(64),grant:{id:'grant',recipientUserId:'buyer',recipientEmail:'buyer@example.invalid',scope:'SOURCE_AUTHORITY_VIEW',resourceReference:'BAF-SAI',resourceVersion:1,issuedAt:new Date(at.getTime()-60000),expiresAt:new Date(at.getTime()+60000),revokedAt:null,request:{status:'APPROVED',requesterEmail:'buyer@example.invalid',scope:'SOURCE_AUTHORITY_VIEW',resourceReference:'BAF-SAI',resourceVersion:1}}};
const current={kind:'SOURCE_AUTHORITY',reference:'BAF-SAI',version:1,recipientContentHash:'a'.repeat(64)};
const input={dossier,item,current,userId:'buyer',email:'buyer@example.invalid',at};
assert.equal(buyerDossierIdentityAllowsAccess(input),true);
assert.equal(buyerDossierItemAllowsAccess(input),true);
for(const change of [
 {userId:'other'}, {email:'other@example.invalid'}, {at:new Date(NaN)},
 {dossier:{...dossier,revokedAt:at}}, {dossier:{...dossier,expiresAt:at}},
 {dossier:{...dossier,recipient:{email:'renamed@example.invalid'}}},
 {item:{...item,kind:'AGREEMENT'}}, {item:{...item,grantId:'other'}},
 {current:null}, {current:{...current,version:2}}, {current:{...current,recipientContentHash:'b'.repeat(64)}},
 ...[{revokedAt:at},{expiresAt:at},{issuedAt:new Date(at.getTime()+1)}, {recipientUserId:'other'},{recipientEmail:'other@example.invalid'},{scope:'PROFILE_VIEW'},{resourceVersion:2},{resourceReference:'OTHER'}, {request:{...item.grant.request,status:'DECLINED'}}, {request:{...item.grant.request,requesterEmail:'other@example.invalid'}}].map(grant=>({item:{...item,grant:{...item.grant,...grant}}})),
]) assert.equal(buyerDossierItemAllowsAccess({...input,...change}),false,JSON.stringify(change));
console.log('BUYER_DOSSIER_ACCESS_POLICY_OK: identity, dossier/item revocation, expiry, request integrity, scope, edition and content binding.');
