import assert from "node:assert/strict";
import { resolveBuyerDossierSelection, type BuyerDossierPublication } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/resolveBuyerDossierSelection";
import { buyerPublicationScope } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/buyerSupportingDocumentPolicy";
async function main(){
 const kinds=["INSTITUTIONAL_PROFILE","SOURCE_AUTHORITY","DECLARATION_OF_TRUST","RESELLER_AGREEMENT","SANCTIONS_SCREENING"] as const;
 const publications:BuyerDossierPublication[]=kinds.map((kind,i)=>({kind,resourceReleaseId:`resource-${i}`,reference:`REF-${i}`,version:1,label:kind,recipientContentHash:"a".repeat(64)}));
 const ports={loadPublication:async(id:string)=>publications.find(entry=>entry.resourceReleaseId===id)??null,authorizeIntroductionAndTransmission:async()=>true};
 const ids=publications.map(entry=>entry.resourceReleaseId);
 const first=await resolveBuyerDossierSelection({resourceReleaseIds:ids,ports});assert.ok(first.allowed);
 const reversed=await resolveBuyerDossierSelection({resourceReleaseIds:[...ids].reverse(),ports});assert.ok(reversed.allowed);
 assert.equal(first.reviewHash,reversed.reviewHash);assert.equal(first.publications.length,5);
 assert.equal((await resolveBuyerDossierSelection({resourceReleaseIds:ids,ports:{...ports,authorizeIntroductionAndTransmission:async publication=>publication.kind!=="SANCTIONS_SCREENING"}})).allowed,false);
 assert.equal((await resolveBuyerDossierSelection({resourceReleaseIds:[...ids,"extra"],ports})).allowed,false);
 assert.equal(buyerPublicationScope("SANCTIONS_SCREENING"),"SUPPORTING_DOCUMENT_VIEW");assert.equal(buyerPublicationScope("MASTER_AGREEMENT"),null);
 assert.equal(first.establishesDownloadPermission,false);
 console.log("FIVE_MATERIAL_SELECTION_OK: exact selected publications, atomic sharing checks, stable review, separate scope and no implied downloads.");
}main().catch(error=>{console.error(error);process.exitCode=1;});
