import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){try{return n(s,c)}catch(error){if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s))return n(s+'.ts',c);throw error}}});
const base='../../src/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/';
const {commercialPapers,commercialPaperMetadata,commercialPaperPinMatches}=await import(base+'catalog.ts');
const {reviewTovRepresentativeRevision:review,reviseTovRepresentativeCopy:revise}=await import(base+'reviseTovRepresentativeCopy.ts');
const {loadRepresentativeCommercialPaper:load}=await import(base+'loadRepresentativeCommercialPaper.ts');
const {loadBuyerTovPublicationWithClient:buyer}=await import(base+'loadBuyerTovPublicationWithClient.ts');
const {TOV_PUBLICATION:current}=await import('../../src/domains/institutions/french-ward/tovPublication.ts');
const {TOV_PUBLICATION_LEGACY:legacy}=await import('../../src/domains/institutions/french-ward/tovPublicationLegacy.ts');
const {resolveTovPublication:resolve}=await import('../../src/domains/institutions/french-ward/tovRepresentativeCopy.ts');
const paper=commercialPapers().find(p=>p.key==='TRANSACTION_OVERVIEW');
function fixture(){
 const metadata=commercialPaperMetadata(paper);metadata.commercialPaper.publicationHash=legacy.publicationHash;
 const row={id:'resource',packageId:'pack',resourceId:paper.reference,module:'DOCUMENTS',resourceType:'STRUCTURED_CONTENT',state:'RELEASED',canView:true,canDownload:false,canPresent:true,canTransmit:true,metadata,package:{id:'pack',reference:'CUP-001',version:1,audience:'REPRESENTATIVE',state:'PREPARING',releaseState:'PARTIAL',modules:[{module:'DOCUMENTS',state:'RELEASED'}],participant:{id:'participant',userId:'representative',displayName:'Jens Peter Thomsen',standing:'ACTIVE'}}};
 const state={row,admin:true,active:0,failAudit:false,events:[]};
 const tx={user:{findUnique:async()=>({isAdmin:state.admin})},$queryRaw:async()=>[],representativeProgramAppointment:{findMany:async()=>[{id:'appointment',instrumentId:'instrument'}]},representativeBuyerDossierItem:{count:async()=>state.active},commercialUtilityPackResourceRelease:{findUnique:async({where})=>where.id===row.id?row:null,findFirst:async({where})=>where.id===row.id&&where.package.participant.userId==='representative'&&(!where.canTransmit||row.canTransmit)?row:null,update:async({data,where})=>{assert.equal(where.id,row.id);assert.deepEqual(Object.keys(data),['metadata']);row.metadata=data.metadata;return row}},domainEvent:{create:async({data})=>{if(state.failAudit)throw new Error('audit failure');state.events.push(data);return data}}};
 const client={...tx,$transaction:async(run)=>{const snapshot=structuredClone(row.metadata),count=state.events.length;try{return await run(tx)}catch(e){row.metadata=snapshot;state.events.length=count;throw e}}};
 return{state,client};
}
async function input(f){const r=await review({client:f.client,resourceReleaseId:'resource'});return{client:f.client,actorUserId:'admin',resourceReleaseId:'resource',reviewHash:r.reviewHash,expectedPublicationHash:r.copy.publicationHash,reason:'Approved mobile layout and named representative copy.'};}
{
 const f=fixture();assert(commercialPaperPinMatches(f.state.row.metadata,paper));const old=await load({client:f.client,userId:'representative',resourceReleaseId:'resource'});assert.equal(old.publicationHtml,legacy.html);
 const fields=await input(f),permissions=[f.state.row.canView,f.state.row.canDownload,f.state.row.canPresent,f.state.row.canTransmit];
 const result=await revise(fields);assert(!result.alreadyCurrent);assert.equal(f.state.events.length,1);assert.equal(f.state.events[0].payload.previousPublicationHash,legacy.publicationHash);assert.equal(f.state.row.state,'RELEASED');assert.deepEqual([f.state.row.canView,f.state.row.canDownload,f.state.row.canPresent,f.state.row.canTransmit],permissions);
 const copy=await load({client:f.client,userId:'representative',resourceReleaseId:'resource'});assert(copy.publicationHtml.includes('Jens Peter Thomsen'));assert(copy.publicationHtml.includes('Publication revision 02'));assert.equal(copy.contentHash,legacy.contentHash);assert.notEqual(copy.publicationHash,current.publicationHash);
 const projection=await buyer({client:f.client,userId:'representative',resourceReleaseId:'resource'});assert.equal(projection.recipientContentHash,copy.publicationHash);assert.equal(projection.content.html,copy.publicationHtml);
 assert.equal(await load({client:f.client,userId:'other',resourceReleaseId:'resource'}),null);
 const savedId=f.state.row.metadata.tovRepresentativeCopy.resourceReleaseId;f.state.row.metadata.tovRepresentativeCopy.resourceReleaseId='other-resource';assert.equal(await load({client:f.client,userId:'representative',resourceReleaseId:'resource'}),null);f.state.row.metadata.tovRepresentativeCopy.resourceReleaseId=savedId;
 const again=await revise(fields);assert(again.alreadyCurrent);assert.equal(f.state.events.length,1);
 f.state.row.metadata.tovRepresentativeCopy.displayName='Changed after review';assert.equal(resolve(f.state.row.metadata),null);assert.equal(await load({client:f.client,userId:'representative',resourceReleaseId:'resource'}),null);
}
{
 const f=fixture(),fields=await input(f);f.state.active=1;await assert.rejects(()=>revise(fields),/ACTIVE_BUYER_INVITATIONS/);assert.equal(f.state.events.length,0);assert.equal(resolve(f.state.row.metadata).publicationHash,legacy.publicationHash);
}
{
 const f=fixture(),fields=await input(f);f.state.row.canTransmit=false;await assert.rejects(()=>revise(fields),/REVIEW_CHANGED/);assert.equal(f.state.events.length,0);
}
{
 const f=fixture(),fields=await input(f);f.state.admin=false;await assert.rejects(()=>revise(fields),/ADMIN_REQUIRED/);assert.equal(f.state.events.length,0);
}
{
 const f=fixture(),fields=await input(f);f.state.failAudit=true;await assert.rejects(()=>revise(fields),/audit failure/);assert.equal(resolve(f.state.row.metadata).publicationHash,legacy.publicationHash);assert.equal(f.state.events.length,0);
}
{
 const f=fixture(),fields=await input(f);fields.expectedPublicationHash='0'.repeat(64);await assert.rejects(()=>revise(fields),/REVIEW_CHANGED/);
}
console.log('TOV_PUBLICATION_REVISION_OK: archived reading, shared revised copy, exact content hash, owner binding, permission preservation, explicit atomic audit, stale review and active-invitation denial, rollback and idempotent replay. No database or email used.');
