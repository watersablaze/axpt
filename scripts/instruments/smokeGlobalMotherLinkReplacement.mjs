import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const state = globalThis.__gmLinkTest = { admin: true, revoked: false, events: [], hash: "original", sessions: 1, challenges: 1, receipts: ["unchanged"] };
const tx = {
  instrumentAccessGrant: {
    findUnique: async () => ({ id: "testgrant123", codeHash: state.hash, instrumentId: "instrument", instrumentVersionId: "version", recipientUserId: "recipient", revokedAt: state.revoked ? new Date() : null, expiresAt: new Date(Date.now()+86400000), instrument: { reference: "GM-KENYA-RCF-001", currentVersion: 2 }, instrumentVersion: { number: 2, status: "ISSUED" } }),
    updateMany: async ({where,data}) => { if (state.hash !== where.codeHash) return {count:0}; state.hash=data.codeHash; return {count:1}; },
  },
  globalMotherRecipientChallenge: { deleteMany: async () => { state.challenges=0; } },
  session: { updateMany: async ({where}) => { assert.equal(where.deviceInfo,"gm-grant:testgrant123");state.sessions=0; } },
  domainEvent: { create: async ({data}) => { state.events.push(data); } },
};
state.prisma = { $transaction: async callback => callback(tx) };
const virtual = {
  "@/infrastructure/db/prisma": "export const prisma=globalThis.__gmLinkTest.prisma;",
  "@/domains/auth/getPrincipal": "export async function getPrincipal(){return globalThis.__gmLinkTest.admin?{userId:'admin'}:null;}",
  "@/domains/auth/isAdmin": "export function isAdmin(p){return Boolean(p);}",
  "@/domains/instruments/definitions/globalMotherV2Definition": "export const globalMotherV2Definition={reference:'GM-KENYA-RCF-001'};",
};
registerHooks({
  resolve(specifier,context,next){
    if(virtual[specifier])return {url:'gm-link:'+specifier,shortCircuit:true};
    if(specifier==='next/server')return next('next/server.js',context);
    if(specifier.startsWith('@/')){const p=resolve(root,'src',specifier.slice(2)+'.ts');if(existsSync(p))return {url:pathToFileURL(p).href,shortCircuit:true};}
    return next(specifier,context);
  },
  load(url,context,next){if(url.startsWith('gm-link:'))return {format:'module',source:virtual[url.slice(8)],shortCircuit:true};return next(url,context);},
});
const {POST}=await import('../../app/api/admin/instruments/gm-kenya/replace-link/route.ts');
const request=(origin='https://example.test',confirmation='REPLACE PRIVATE LINK')=>new Request('https://example.test/api/admin/instruments/gm-kenya/replace-link',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({grantId:'testgrant123',confirmation})});
assert.equal((await POST(request('https://other.test'))).status,403);
state.admin=false;assert.equal((await POST(request())).status,403);state.admin=true;
assert.equal((await POST(request(undefined,'wrong'))).status,400);
state.revoked=true;assert.equal((await POST(request())).status,409);assert.equal(state.hash,'original');state.revoked=false;
const response=await POST(request());assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
const body=await response.json();const token=body.privatePath.split('/').pop();
assert.equal(state.hash,createHash('sha256').update(token).digest('hex'));
assert.notEqual(state.hash,'original');assert.equal(state.sessions,0);assert.equal(state.challenges,0);
assert.deepEqual(state.receipts,['unchanged']);assert.equal(state.events.length,1);
assert.ok(!JSON.stringify(state.events).includes(token));
console.log('GM_LINK_REPLACEMENT_PASSED · admin, origin, confirmation, revoked access, token rotation, session invalidation, code invalidation, receipt preservation, secret-free audit');
