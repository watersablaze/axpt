import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Resolve extensionless TS imports without third-party dependencies (Node 24).
registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const candidate = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
}});
const base = '../../src/domains/instruments/representative-program/commercial-utility-pack/';
const { commercialPapers, commercialPaperMetadata, assertCommercialPaperReleasePin } = await import(base + 'commercial-papers/catalog.ts');
const { stageCommercialPapers } = await import(base + 'commercial-papers/stageCommercialPapers.ts');
const { loadRepresentativeCommercialPaper } = await import(base + 'commercial-papers/loadRepresentativeCommercialPaper.ts');
const { reviewSelectedCommercialUtilityPackAdditions, releaseSelectedCommercialUtilityPackAdditions } = await import(base + 'application/releaseSelectedCommercialUtilityPackAdditions.ts');
const { frenchWardTransactionOverview } = await import('../../src/domains/institutions/french-ward/frenchWardTransactionOverview.ts');
const { adaptFrenchWardCommercialPaperComposition } = await import(base + 'composition/adaptFrenchWardCommercialPaperComposition.ts');
const { assertCommercialUtilityPackCompositionDescriptor } = await import(base + 'composition/contracts.ts');
function fixture() {
  const state = {admin: true, rows: [], events: [], locks: [], next: 1, clock: new Date('2026-10-21T10:00:00Z'),
    pack: {id: 'pack', reference: 'CUP-TEST', participantId: 'participant', version: 1, state: 'CURRENT',
      audience: 'REPRESENTATIVE', releaseState: 'RELEASED', updatedAt: new Date('2026-10-20T10:00:00Z'),
      modules: ['REPRESENTATION', 'COMMERCIAL_PARAMETERS', 'DOCUMENTS', 'OPERATING_BOUNDARIES'].map(module => ({id: module, module, state: 'RELEASED', updatedAt: new Date('2026-10-20T10:00:00Z')}))}};
  const tx = {
    user: {findUnique: async () => ({isAdmin: state.admin})},
    representativeProgramParticipant: {findMany: async ({where}) => where.userId === 'owner' ? [{id: 'participant'}] : []},
    commercialUtilityPack: {findUnique: async ({select} = {}) => select?.resources ? {...state.pack, resources: state.rows} : state.pack},
    commercialUtilityPackModuleRelease: {findUnique: async ({where}) => state.pack.modules.find(m => m.module === where.packageId_module.module)},
    commercialUtilityPackResourceRelease: {
      findUnique: async ({where}) => where.id ? state.rows.find(r => r.id === where.id) ?? null
        : state.rows.find(r => Object.entries(where.packageId_module_resourceType_resourceId).every(([k,v]) => r[k] === v)) ?? null,
      create: async ({data}) => {const row = {...data, id: 'r' + state.next++, releasedAt: null, releasedByUserId: null, updatedAt: state.clock}; state.rows.push(row); return row;},
      findMany: async ({where}) => state.rows.filter(r => r.packageId === where.packageId && where.id.in.includes(r.id)).sort((a,b) => a.id.localeCompare(b.id)),
      findFirst: async ({where}) => {
        if (where.package.participant.userId !== 'owner' || !['PREPARING','CURRENT'].includes(state.pack.state) ||
            state.pack.modules.find(m => m.module === 'DOCUMENTS').state !== 'RELEASED') return null;
        const row = state.rows.find(r => r.id === where.id && r.state === 'RELEASED' && r.canView);
        return row ? {resourceId: row.resourceId, metadata: row.metadata} : null;
      },
      updateMany: async ({where, data}) => {const row = state.rows.find(r => r.id === where.id && r.state === where.state);
        if (!row) return {count: 0}; Object.assign(row, data); return {count: 1};},
    },
    domainEvent: {create: async ({data}) => {state.events.push(data); return data;}},
    $queryRaw: async (strings, ...values) => {state.locks.push([strings.join('?'), values]); return [];},
  };
  const client = {...tx, $transaction: async (run) => {
    const snapshot = structuredClone({rows: state.rows, events: state.events});
    try {return await run(tx);} catch (error) {state.rows = snapshot.rows; state.events = snapshot.events; throw error;}
  }};
  return {state, client};
}
const papers = commercialPapers();
assert.equal(papers.length, 2);
assert.equal(new Set(papers.map(p => p.reference)).size, 2);
for (const p of papers) {
  const descriptor = adaptFrenchWardCommercialPaperComposition(p);
  assert.equal(descriptor.module, 'DOCUMENTS');
  assert.throws(() => assertCommercialUtilityPackCompositionDescriptor({...descriptor, module: 'REPRESENTATION'}));
  assertCommercialPaperReleasePin({module:'DOCUMENTS',resourceType:'STRUCTURED_CONTENT',resourceId:p.reference,metadata:commercialPaperMetadata(p)});
  assert.throws(() => assertCommercialPaperReleasePin({module:'DOCUMENTS',resourceType:'STRUCTURED_CONTENT',resourceId:p.reference,metadata:{}}));
}
assertCommercialPaperReleasePin({module:'DOCUMENTS',resourceType:'DOCUMENT',resourceId:'unrelated',metadata:{}});
const hashes = Object.fromEntries(papers.map(p => [p.key, p.contentHash]));
const request = {actorUserId:'admin',packageId:'pack',keys:papers.map(p => p.key),expectedContentHashes:hashes};
const {state, client} = fixture();
const parentBefore = JSON.stringify(state.pack);
const first = await stageCommercialPapers({...request,client});
assert.equal(first.releasePerformed, false);
assert.equal(state.rows.length, 2);
assert(state.rows.every(r => r.state === 'WITHHELD' && r.canView && !r.canDownload && !r.canPresent && !r.canTransmit));
assert.equal(await loadRepresentativeCommercialPaper({client,userId:'owner',resourceReleaseId:state.rows[0].id}), null);
assert.equal(await loadRepresentativeCommercialPaper({client,userId:'other-user',resourceReleaseId:state.rows[0].id}), null);
// Retries preserve resources and create no duplicate event, including previously governed permission changes.
state.rows[0].canDownload = true;
const repeat = await stageCommercialPapers({...request,client});
assert(repeat.resources.every(r => !r.created));
assert.equal(state.events.length, 1);
assert.equal(state.rows[0].canDownload, true);
const releaseInput = {client,actorUserId:'admin',packageId:'pack',resourceReleaseIds:state.rows.map(r => r.id)};
const review = await reviewSelectedCommercialUtilityPackAdditions(releaseInput);
const before = frenchWardTransactionOverview.status;
frenchWardTransactionOverview.status = before + ' changed';
await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions({...releaseInput,reviewHash:review.reviewHash,reason:'Test release',confirmRelease:true}), /COMMERCIAL_PAPER_CHANGED/);
assert(state.rows.every(r => r.state === 'WITHHELD'));
await assert.rejects(() => stageCommercialPapers({...request,client}), /REVIEW_CHANGED/);
frenchWardTransactionOverview.status = before;
state.rows[0].canPresent = true;
await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions({...releaseInput,reviewHash:review.reviewHash,reason:'Test release',confirmRelease:true}), /REVIEW_CHANGED/);
const fresh = await reviewSelectedCommercialUtilityPackAdditions(releaseInput);
const permissions = state.rows.map(r => [r.canView,r.canDownload,r.canPresent,r.canTransmit]);
await releaseSelectedCommercialUtilityPackAdditions({...releaseInput,reviewHash:fresh.reviewHash,reason:'Controlled internal reading release',confirmRelease:true});
assert(state.rows.every(r => r.state === 'RELEASED'));
assert.deepEqual(state.rows.map(r => [r.canView,r.canDownload,r.canPresent,r.canTransmit]), permissions);
assert.equal(JSON.stringify(state.pack), parentBefore);
assert.equal(state.events.filter(e => e.eventType === 'COMMERCIAL_UTILITY_PACK_SELECTED_ADDITIONS_RELEASED').length, 1);
await assert.rejects(() => releaseSelectedCommercialUtilityPackAdditions({...releaseInput,reviewHash:fresh.reviewHash,reason:'Retry',confirmRelease:true}), /RELEASE_STATE_CONFLICT/);
// Supply the projection's relational resource list to exercise the authorized read path.

assert.equal((await loadRepresentativeCommercialPaper({client,userId:'owner',resourceReleaseId:state.rows[0].id})).reference, papers[0].reference);
frenchWardTransactionOverview.status = before + ' revised after release';
assert.equal(await loadRepresentativeCommercialPaper({client,userId:'owner',resourceReleaseId:state.rows[0].id}), null);
frenchWardTransactionOverview.status = before;
for (const mutate of [s => {s.admin=false;}, s => {s.pack.state='WITHDRAWN';}, s => {s.pack.audience='OTHER';},
  s => {s.pack.modules.find(m => m.module==='DOCUMENTS').state='READY';}]) {
  const f = fixture(); mutate(f.state);
  await assert.rejects(() => stageCommercialPapers({...request,client:f.client}));
  assert.equal(f.state.rows.length, 0); assert.equal(f.state.events.length, 0);
}
const f=fixture();
await assert.rejects(() => stageCommercialPapers({...request,keys:[papers[0].key,papers[0].key],client:f.client}), /INPUT_INVALID/);
// A second-paper conflict rolls back the first insert in the same transaction.
f.state.rows.push({id:'old',packageId:'pack',module:'DOCUMENTS',resourceType:'STRUCTURED_CONTENT',resourceId:papers[1].reference,state:'WITHHELD',metadata:{}});
await assert.rejects(() => stageCommercialPapers({...request,client:f.client}), /EXISTING_CONFLICT/);
assert.equal(f.state.rows.length, 1); assert.equal(f.state.events.length, 0);
const {resolveBuyerDossierSelection} = await import(base + 'application/resolveBuyerDossierSelection.ts');
for (const paper of papers) {
  const denied = await resolveBuyerDossierSelection({resourceReleaseIds:['commercial-paper'], ports:{
    loadPublication: async () => ({resourceReleaseId:'commercial-paper',kind:paper.key,reference:paper.reference,
      version:paper.version,label:paper.title,recipientContentHash:paper.contentHash}),
    authorizeIntroductionAndTransmission: async () => {throw new Error('Unsupported paper must be rejected before authority evaluation');},
  }});
  assert.deepEqual(denied, {allowed:false,reason:'PUBLICATION_UNAVAILABLE'});
}
console.log('PASS: candidate identities, descriptor shapes, withheld staging, idempotency, permission preservation, admin/package gates, atomic rollback, stale content/review rejection, selected release, parent history preservation, owner-only reading, post-release drift denial.');
