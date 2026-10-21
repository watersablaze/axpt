import {createHash} from "node:crypto";
import type {PrismaClient} from "@prisma/client";
type JsonValueInput = string | number | boolean | null | JsonObjectInput | readonly JsonValueInput[];
type JsonObjectInput = {readonly [key: string]: JsonValueInput | undefined};
import {commercialPapers,commercialPaperMetadata,commercialPaperPinMatches} from "./catalog";
import {createTovCopyPin,resolveTovPublication} from "../../../../institutions/french-ward/tovRepresentativeCopy";
type Reader=Pick<PrismaClient,"commercialUtilityPackResourceRelease"|"representativeProgramAppointment"|"representativeBuyerDossierItem">;
type Transaction=Reader & Pick<PrismaClient,"user"|"domainEvent"|"$queryRaw">;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):object(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
const digest=(v:unknown)=>createHash("sha256").update(JSON.stringify(canonical(v))).digest("hex");
export async function reviewTovRepresentativeRevision(input:{client:Reader;resourceReleaseId:string;at?:Date}) {
 const at=input.at??new Date();
 const resource=await input.client.commercialUtilityPackResourceRelease.findUnique({where:{id:input.resourceReleaseId},include:{package:{include:{modules:true,participant:true}}}});
 const paper=commercialPapers().find(p=>p.key==="TRANSACTION_OVERVIEW")!;
 if(!resource||resource.resourceId!==paper.reference||resource.module!=="DOCUMENTS"||resource.resourceType!=="STRUCTURED_CONTENT"||resource.state!=="RELEASED"||!resource.canView||
   resource.package.version!==1||resource.package.audience!=="REPRESENTATIVE"||!["PREPARING","CURRENT"].includes(resource.package.state)||!["PARTIAL","RELEASED"].includes(resource.package.releaseState)||
   resource.package.modules.filter((m:{module:string;state:string})=>m.module==="DOCUMENTS"&&m.state==="RELEASED").length!==1||
   resource.package.participant.standing!=="ACTIVE"||!resource.package.participant.userId||!commercialPaperPinMatches(resource.metadata,paper))throw new Error("[TOV_REVISION_RESOURCE_UNAVAILABLE]");
 const participant=resource.package.participant;
 const appointments=await input.client.representativeProgramAppointment.findMany({where:{participantId:participant.id,instrument:{status:"ACTIVE"},effectiveAt:{lte:at},endedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:at}}]},select:{id:true,instrumentId:true},take:2});
 if(appointments.length!==1)throw new Error("[TOV_REVISION_APPOINTMENT_UNAVAILABLE]");
 const copy=createTovCopyPin({resourceReleaseId:resource.id,participantId:participant.id,representativeUserId:participant.userId!,displayName:participant.displayName});
 const current=resolveTovPublication(resource.metadata)!;
 const activeBuyerInvitations=await input.client.representativeBuyerDossierItem.count({where:{resourceReleaseId:resource.id,dossier:{revokedAt:null,expiresAt:{gt:at}},grant:{revokedAt:null,expiresAt:{gt:at}}}});
 const permissions={canView:resource.canView,canDownload:resource.canDownload,canPresent:resource.canPresent,canTransmit:resource.canTransmit};
 const reviewHash=digest({resourceReleaseId:resource.id,metadata:resource.metadata,copy,permissions,participantId:participant.id,appointmentId:appointments[0].id});
 const metadata={...(object(resource.metadata)?resource.metadata:{}),...commercialPaperMetadata(paper),tovRepresentativeCopy:copy};
 return {resource,appointment:appointments[0],copy,current,metadata,permissions,reviewHash,activeBuyerInvitations,alreadyCurrent:current.copy!==null&&digest(current.copy)===digest(copy)};
}
/** Explicit reviewed metadata revision only. No release/permission/authority or email side effects. */
export async function reviseTovRepresentativeCopy(input:{client:Pick<PrismaClient,"$transaction">;actorUserId:string;resourceReleaseId:string;reviewHash:string;expectedPublicationHash:string;reason:string}) {
 if(!input.actorUserId.trim()||!input.resourceReleaseId||input.resourceReleaseId.length>191||!/^[a-f0-9]{64}$/.test(input.reviewHash)||!/^[a-f0-9]{64}$/.test(input.expectedPublicationHash)||input.reason.trim().length<8||input.reason.length>1000)throw new Error("[TOV_REVISION_INPUT_INVALID]");
 return input.client.$transaction(async(tx:Transaction)=>{
  const actor=await tx.user.findUnique({where:{id:input.actorUserId},select:{isAdmin:true}});
  if(!actor?.isAdmin)throw new Error("[TOV_REVISION_ADMIN_REQUIRED]");
  const initial=await reviewTovRepresentativeRevision({client:tx,resourceReleaseId:input.resourceReleaseId});
  await tx.$queryRaw`SELECT id FROM "RepresentativeProgramParticipant" WHERE id = ${initial.resource.package.participant.id} FOR SHARE`;
  await tx.$queryRaw`SELECT id FROM "RepresentativeProgramAppointment" WHERE id = ${initial.appointment.id} FOR SHARE`;
  await tx.$queryRaw`SELECT id FROM "InstitutionalInstrument" WHERE id = ${initial.appointment.instrumentId} FOR SHARE`;
  await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackResourceRelease" WHERE id = ${input.resourceReleaseId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "CommercialUtilityPack" WHERE id = ${initial.resource.packageId} FOR SHARE`;
  await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackModuleRelease" WHERE "packageId" = ${initial.resource.packageId} ORDER BY id FOR SHARE`;
  const review=await reviewTovRepresentativeRevision({client:tx,resourceReleaseId:input.resourceReleaseId});
  if(review.copy.publicationHash!==input.expectedPublicationHash)throw new Error("[TOV_REVISION_REVIEW_CHANGED]");
  if(review.alreadyCurrent)return {resourceReleaseId:input.resourceReleaseId,publicationHash:review.copy.publicationHash,alreadyCurrent:true};
  if(review.reviewHash!==input.reviewHash)throw new Error("[TOV_REVISION_REVIEW_CHANGED]");
  if(review.activeBuyerInvitations)throw new Error("[TOV_REVISION_ACTIVE_BUYER_INVITATIONS]");
  const previousMetadata=review.resource.metadata;
  await tx.commercialUtilityPackResourceRelease.update({where:{id:input.resourceReleaseId},data:{metadata:review.metadata as JsonObjectInput}});
  await tx.domainEvent.create({data:{streamType:"COMMERCIAL_UTILITY_PACK",streamId:review.resource.packageId,eventType:"COMMERCIAL_UTILITY_PACK_TOV_PUBLICATION_REVISED",eventVersion:1,payload:{resourceReleaseId:input.resourceReleaseId,reason:input.reason.trim(),previousMetadata,nextMetadata:review.metadata,previousPublicationHash:review.current.publicationHash,publicationHash:review.copy.publicationHash,permissions:review.permissions,releaseStateUnchanged:true} as JsonObjectInput,metadata:{actorUserId:input.actorUserId,source:"arp.tov-publication-revision"}}});
  return {resourceReleaseId:input.resourceReleaseId,publicationHash:review.copy.publicationHash,alreadyCurrent:false};
 },{isolationLevel:"Serializable",maxWait:10000,timeout:30000});
}
