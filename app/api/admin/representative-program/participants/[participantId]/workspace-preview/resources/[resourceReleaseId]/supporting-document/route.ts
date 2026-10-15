import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { respondSupportingDocument } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/respondSupportingDocument";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{participantId:string;resourceReleaseId:string}>}) {
 const principal=await getPrincipal();const headers={"Cache-Control":"private, no-store"};
 if(!principal)return new NextResponse(null,{status:401,headers});
 if(!isAdmin(principal))return new NextResponse(null,{status:403,headers});
 const {participantId,resourceReleaseId}=await context.params;
 if(!participantId||participantId.length>191)return new NextResponse(null,{status:400,headers});
 const participant=await prisma.representativeProgramParticipant.findUnique({where:{id:participantId},select:{userId:true}});
 if(!participant?.userId)return new NextResponse(null,{status:404,headers});
 return respondSupportingDocument(request,()=>loadRepresentativeSupportingDocumentWithClient({client:prisma,userId:participant.userId!,resourceReleaseId}),true);
}
