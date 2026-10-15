import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRecipientBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { respondSupportingDocument } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/respondSupportingDocument";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{dossierId:string;itemId:string}>}) {
 const principal=await getPrincipal();if(!principal)return new NextResponse(null,{status:401,headers:{"Cache-Control":"private, no-store"}});
 const {dossierId,itemId}=await context.params;
 return respondSupportingDocument(request,async()=>{
  const dossier=await loadRecipientBuyerDossierWithClient({client:prisma,dossierId,userId:principal.userId,email:principal.email});
  const item=dossier?.items.find(entry=>entry.id===itemId);
  if(!item?.available||!item.publication||["INSTITUTIONAL_PROFILE","SOURCE_AUTHORITY"].includes(item.publication.kind))return null;
  const record=await prisma.representativeBuyerDossier.findUnique({where:{id:dossierId},select:{actorUserId:true,items:{where:{id:itemId},select:{resourceReleaseId:true}}}});
  if(!record||record.items.length!==1)return null;
  const supporting=await loadRepresentativeSupportingDocumentWithClient({client:prisma,userId:record.actorUserId,resourceReleaseId:record.items[0].resourceReleaseId});
  if(!supporting||supporting.publication.reference!==item.reference||supporting.publication.version!==item.version)return null;
  return {...supporting,canDownload:item.canDownload===true};
 });
}
