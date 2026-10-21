import {createHash} from "node:crypto";
import {TOV_PUBLICATION} from "./tovPublication";
import {TOV_PUBLICATION_LEGACY} from "./tovPublicationLegacy";
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
export type TovCopyPin={schemaVersion:1;publicationRevision:2;basePublicationHash:string;resourceReleaseId:string;participantId:string;representativeUserId:string;displayName:string;publicationHash:string};
export function renderTovRepresentativeCopy(displayName:string) {
  if(!displayName.trim()||displayName.length>120)throw new Error("[TOV_COPY_IDENTITY_INVALID]");
  if(hash(TOV_PUBLICATION.html)!==TOV_PUBLICATION.publicationHash)throw new Error("[TOV_COPY_SOURCE_CHANGED]");
  const marker='<div class="heroComposition">';
  if(TOV_PUBLICATION.html.split(marker).length!==2)throw new Error("[TOV_COPY_SOURCE_CHANGED]");
  return TOV_PUBLICATION.html.replace(marker,'<section class="representativeCopy" aria-label="Representative copy"><span>Presented by · Authorized Representative</span><strong>'+esc(displayName)+'</strong></section>'+marker);
}
export function createTovCopyPin(input:{resourceReleaseId:string;participantId:string;representativeUserId:string;displayName:string}):TovCopyPin {
  return {schemaVersion:1,publicationRevision:2,basePublicationHash:TOV_PUBLICATION.publicationHash,...input,publicationHash:hash(renderTovRepresentativeCopy(input.displayName))};
}
/** Read the exact reviewed copy; never substitute the latest source on a mismatching pin. */
export function resolveTovPublication(metadata:unknown):{html:string;publicationHash:string;publicationRevision:number;copy:TovCopyPin|null}|null {
  if(!object(metadata)||!object(metadata.commercialPaper))return null;
  const basePin=metadata.commercialPaper.publicationHash;
  if(Object.hasOwn(metadata,"tovRepresentativeCopy")) {
    const c=metadata.tovRepresentativeCopy;
    if(!object(c)||c.schemaVersion!==1||c.publicationRevision!==2||c.basePublicationHash!==TOV_PUBLICATION.publicationHash||basePin!==TOV_PUBLICATION.publicationHash||
      !["resourceReleaseId","participantId","representativeUserId","displayName","publicationHash"].every(k=>typeof c[k]==="string"&&String(c[k]).trim().length>0&&String(c[k]).length<=191))return null;
    try{const copy=c as unknown as TovCopyPin;const html=renderTovRepresentativeCopy(copy.displayName);if(hash(html)!==copy.publicationHash)return null;return {html,publicationHash:copy.publicationHash,publicationRevision:2,copy};}catch{return null;}
  }
  for(const [artifact,revision] of [[TOV_PUBLICATION,2],[TOV_PUBLICATION_LEGACY,1]] as const) {
    if(basePin===artifact.publicationHash&&hash(artifact.html)===artifact.publicationHash)return {html:artifact.html,publicationHash:artifact.publicationHash,publicationRevision:revision,copy:null};
  }
  return null;
}
