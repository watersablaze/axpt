import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
registerHooks({resolve(s,c,next){if(s.startsWith('.')){const u=new URL(s,c.parentURL);if(existsSync(fileURLToPath(u)+'.ts'))return{url:u.href+'.ts',shortCircuit:true};}return next(s,c);}});
const { globalMotherDraftingGate, validateGlobalMotherDraftingDispositions } = await import('../../src/domains/instruments/invariants/globalMotherDraftingGate.ts');
const positions = () => Array.from({length:8},(_,i)=>({reference:`ALIGN-0${i+1}`,responseType:'AFFIRM'}));
assert.equal(globalMotherDraftingGate([{id:'old',representedInstitution:'AOTG',positions:positions().slice(0,7)}]).invalidResponses,true);
const duplicate=positions();duplicate[7]={...duplicate[6]};
assert.equal(globalMotherDraftingGate([{id:'duplicate',representedInstitution:'AOTG',positions:duplicate}]).invalidResponses,true);
const eighth=positions();eighth[7]={reference:'ALIGN-08',responseType:'CLARIFY',note:'Clarify meeting availability expectations.'};
assert.equal(globalMotherDraftingGate([{id:'eighth',representedInstitution:'AOTG',positions:eighth}]).issues[0].reference,'ALIGN-08');
const receipts = [{id:'receipt1',representedInstitution:'AXPT Preview Test',positions:positions()},{id:'receipt2',representedInstitution:'AOTG',positions:positions()}];
assert.deepEqual(globalMotherDraftingGate(receipts).missingInstitutions,['ND Royal Ministry']);
receipts[0].representedInstitution='ND Royal Ministry';
receipts[1].positions[5]={reference:'ALIGN-06',responseType:'CLARIFY',note:'Clarify the scope and delivery stages.'};
const gate=globalMotherDraftingGate(receipts);assert.equal(gate.canOpen,true);
assert.equal(validateGlobalMotherDraftingDispositions(gate.issues,[]),null);
const dispositions=[{receiptId:'receipt2',reference:'ALIGN-06',treatment:'CARRY_TO_DRAFTING',note:'Describe scope and delivery stages as open terms for recipient review.'}];
assert.ok(validateGlobalMotherDraftingDispositions(gate.issues,dispositions));
assert.equal(validateGlobalMotherDraftingDispositions(gate.issues,[{...dispositions[0],reference:'ALIGN-05'}]),null);
const state=globalThis.__gmGateTest={receipts,decisions:[],events:[],admin:true};
const tx={
 globalMotherDraftingDecision:{findUnique:async({where})=>state.decisions.find(d=>d.decisionKey===where.decisionKey),create:async({data})=>{const row={id:'decision'+state.decisions.length,...data};state.decisions.push(row);return row;}},
 institutionalInstrument:{findUnique:async()=>({id:'instrument',currentVersion:3,versions:[{id:'version'}]})},
 instrumentResponseSet:{findMany:async()=>state.receipts},
 domainEvent:{create:async({data})=>state.events.push(data)},
};
state.tx=tx;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const virtual={
 '@/infrastructure/db/prisma':'export const prisma={};',
 '@/domains/auth/getPrincipal':"export async function getPrincipal(){return globalThis.__gmGateTest.admin?{userId:'operator'}:null;}",
 '@/domains/auth/isAdmin':'export function isAdmin(p){return Boolean(p);}',
 '@/domains/instruments/governance/runInstrumentGovernanceTransaction':'export async function runInstrumentGovernanceTransaction(p,fn){return fn(globalThis.__gmGateTest.tx);}',
 '@/domains/instruments/eventTypes':"export const INSTRUMENT_EVENT_TYPE={GM_V2_DRAFTING_DECISION_RECORDED:'GM_V2_DRAFTING_DECISION_RECORDED'};",
 '@/domains/instruments/definitions/globalMotherV3Definition':"export const globalMotherV3Definition={reference:'GM-KENYA-RCF-001',version:3};",
};
registerHooks({resolve(s,c,next){if(virtual[s])return{url:'gm-gate:'+s,shortCircuit:true};if(s==='next/server')return next('next/server.js',c);if(s.startsWith('@/')){const p=resolve(root,'src',s.slice(2)+'.ts');if(existsSync(p))return{url:pathToFileURL(p).href,shortCircuit:true};}return next(s,c);},load(u,c,next){if(u.startsWith('gm-gate:'))return{format:'module',source:virtual[u.slice(8)],shortCircuit:true};return next(u,c);}});
const {POST}=await import('../../app/api/admin/instruments/gm-kenya/drafting-decision/route.ts');
const input={versionId:'version',standing:'OPEN_DRAFTING',rationale:'Preview decision testing explicit treatment of outstanding positions.',reviewedReceiptIds:['receipt1','receipt2'],decisionKey:'test-decision-key-001',confirmation:'RECORD DRAFTING DECISION',dispositions};
async function call(overrides={},origin='https://example.test'){return POST(new Request('https://example.test/api/admin/instruments/gm-kenya/drafting-decision',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({...input,...overrides})}));}
assert.equal((await call({},'https://other.test')).status,403);
state.admin=false;assert.equal((await call()).status,403);state.admin=true;
receipts[0].representedInstitution='AXPT Preview Test';assert.equal((await call()).status,409);assert.equal(state.decisions.length,0);receipts[0].representedInstitution='ND Royal Ministry';
assert.equal((await call({reviewedReceiptIds:['receipt1']})).status,409);
assert.equal((await call({dispositions:[]})).status,409);
assert.equal((await call()).status,200);assert.equal(state.decisions.length,1);assert.equal(state.events.length,1);
assert.ok(state.decisions[0].rationale.includes('ALIGN-06'));assert.equal(receipts[1].positions[5].responseType,'CLARIFY');
assert.equal((await call()).status,200);assert.equal(state.decisions.length,1);
assert.equal((await call({rationale:'Changed decision rationale for the same key.'})).status,409);
receipts[1].positions[5].responseType='DECLINE';assert.equal((await call({decisionKey:'test-decision-key-002'})).status,409);
assert.equal((await call({decisionKey:'test-decision-key-003',standing:'REVIEW_HOLD',dispositions:[]})).status,200);
console.log('GM_DRAFTING_GATE_PASSED · canonical institutions, required treatment, decline hold, receipt review, admin/origin, decision persistence, replay, response preservation');
