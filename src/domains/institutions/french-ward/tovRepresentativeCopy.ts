import {createHash} from "node:crypto";
import {TOV_PUBLICATION} from "./tovPublication";
import {TOV_PUBLICATION_REVISION_03} from "./tovPublicationRevision03";
import {TOV_PUBLICATION_REVISION_02} from "./tovPublicationRevision02";
import {TOV_PUBLICATION_LEGACY} from "./tovPublicationLegacy";

const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);

type CopyRevision=2|3|4;
export type TovCopyPin={
  schemaVersion:1;
  publicationRevision:CopyRevision;
  basePublicationHash:string;
  resourceReleaseId:string;
  participantId:string;
  representativeUserId:string;
  displayName:string;
  publicationHash:string;
};

const publicationForCopy=(revision:CopyRevision)=>
  revision===4?TOV_PUBLICATION:
  revision===3?TOV_PUBLICATION_REVISION_03:
  TOV_PUBLICATION_REVISION_02;

export function renderTovRepresentativeCopy(
  displayName:string,
  publicationRevision:CopyRevision=4
) {
  if(!displayName.trim()||displayName.length>120)
    throw new Error("[TOV_COPY_IDENTITY_INVALID]");
  const publication=publicationForCopy(publicationRevision);
  if(publication.publicationRevision!==publicationRevision||
     hash(publication.html)!==publication.publicationHash)
    throw new Error("[TOV_COPY_SOURCE_CHANGED]");
  const marker='<div class="heroComposition">';
  if(publication.html.split(marker).length!==2)
    throw new Error("[TOV_COPY_SOURCE_CHANGED]");
  return publication.html.replace(
    marker,
    '<section class="representativeCopy" aria-label="Representative copy"><span>Presented by · Authorized Representative</span><strong>'+
    esc(displayName)+'</strong></section>'+marker
  );
}

export function createTovCopyPin(input:{
  resourceReleaseId:string;
  participantId:string;
  representativeUserId:string;
  displayName:string;
}):TovCopyPin {
  return {
    schemaVersion:1,
    publicationRevision:4,
    basePublicationHash:TOV_PUBLICATION.publicationHash,
    ...input,
    publicationHash:hash(renderTovRepresentativeCopy(input.displayName,4))
  };
}

/** Resolve the exact pinned publication; never silently substitute a newer version. */
export function resolveTovPublication(metadata:unknown):{
  html:string;
  publicationHash:string;
  publicationRevision:number;
  copy:TovCopyPin|null;
}|null {
  if(!object(metadata)||!object(metadata.commercialPaper))return null;
  const basePin=metadata.commercialPaper.publicationHash;
  if(typeof basePin!=="string")return null;

  if(Object.hasOwn(metadata,"tovRepresentativeCopy")) {
    const c=metadata.tovRepresentativeCopy;
    if(!object(c)||c.schemaVersion!==1||
       (c.publicationRevision!==2&&c.publicationRevision!==3&&c.publicationRevision!==4)||
       !["resourceReleaseId","participantId","representativeUserId","displayName","publicationHash"]
         .every(k=>typeof c[k]==="string"&&String(c[k]).trim().length>0&&String(c[k]).length<=191))
      return null;
    const revision=c.publicationRevision as CopyRevision;
    const publication=publicationForCopy(revision);
    if(publication.publicationRevision!==revision||
       c.basePublicationHash!==publication.publicationHash||
       basePin!==publication.publicationHash)
      return null;
    try {
      const copy=c as unknown as TovCopyPin;
      const html=renderTovRepresentativeCopy(copy.displayName,revision);
      if(hash(html)!==copy.publicationHash)return null;
      return {html,publicationHash:copy.publicationHash,publicationRevision:revision,copy};
    } catch {return null;}
  }

  for(const artifact of [
    TOV_PUBLICATION,
    TOV_PUBLICATION_REVISION_03,
    TOV_PUBLICATION_REVISION_02,
    TOV_PUBLICATION_LEGACY
  ]) {
    if(basePin===artifact.publicationHash&&
       hash(artifact.html)===artifact.publicationHash)
      return {
        html:artifact.html,
        publicationHash:artifact.publicationHash,
        publicationRevision:"publicationRevision" in artifact &&
          typeof artifact.publicationRevision==="number"
          ? artifact.publicationRevision : 1,
        copy:null
      };
  }
  return null;
}
