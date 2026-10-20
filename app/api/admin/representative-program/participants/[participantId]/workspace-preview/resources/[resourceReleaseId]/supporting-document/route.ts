import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import { respondSupportingDocument } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/respondSupportingDocument";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request,context:{params:Promise<{participantId:string;resourceReleaseId:string}>}) {
 const started=performance.now();
 const principal=await getPrincipal();const principalMs=performance.now()-started;const headers={"Cache-Control":"private, no-store"};
 if(!principal)return new NextResponse(null,{status:401,headers});
 if(!isAdmin(principal))return new NextResponse(null,{status:403,headers});
 const {participantId,resourceReleaseId}=await context.params;
 if(!participantId||participantId.length>191)return new NextResponse(null,{status:400,headers});
 const participant=await prisma.representativeProgramParticipant.findUnique({where:{id:participantId},select:{userId:true}});
 if(!participant?.userId)return new NextResponse(null,{status:404,headers});
 if(process.env.NODE_ENV === "development") console.info("[ARP_SUPPORTING_ACCESS_TIMING]", {
   principalMs: Math.round(principalMs), participantMs: Math.round(performance.now()-started-principalMs),
 });
 const accessMs = performance.now()-started;
 const participantMs = accessMs-principalMs;
 const response = await respondSupportingDocument(request,()=>loadRepresentativeSupportingDocumentWithClient({client:prisma,userId:participant.userId!,resourceReleaseId}),true);
 if(process.env.NODE_ENV === "development") {
   const readTiming = response.headers.get("Server-Timing");
   response.headers.set("Server-Timing", `principal;dur=${principalMs.toFixed(1)}, participant;dur=${participantMs.toFixed(1)}, ` +
     (readTiming ? readTiming + ", " : "") + `total;dur=${(performance.now()-started).toFixed(1)}`);
 }
 return response;
}
