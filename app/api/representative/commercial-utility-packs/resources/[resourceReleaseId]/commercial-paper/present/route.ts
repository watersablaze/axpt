import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialPaper } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/loadRepresentativeCommercialPaper";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { TOV_PUBLICATION } from "@/domains/institutions/french-ward/tovPublication";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control":"private, no-store, max-age=0", "X-Content-Type-Options":"nosniff", "Referrer-Policy":"no-referrer"};
export async function GET(_request: Request, context: {params: Promise<{resourceReleaseId: string}>}) {
  const principal = await getPrincipal();
  if (!principal) return new NextResponse(null,{status:401,headers});
  const {resourceReleaseId} = await context.params;
  if (!resourceReleaseId || resourceReleaseId.length > 191) return new NextResponse(null,{status:400,headers});
  try {
    const paper = await loadRepresentativeCommercialPaper({client:prisma,userId:principal.userId,resourceReleaseId});
    if (!paper || paper.key !== "TRANSACTION_OVERVIEW" || paper.status !== "Approved for representative use") return new NextResponse(null,{status:404,headers});
    const at = new Date();
    const appointments: Array<{id:string}> = await prisma.representativeProgramAppointment.findMany({where:{participant:{userId:principal.userId},instrument:{status:"ACTIVE"},effectiveAt:{lte:at},endedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:at}}]},select:{id:true},take:2});
    if (appointments.length !== 1) return new NextResponse(null,{status:403,headers});
    const decision = await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({client:prisma,userId:principal.userId,appointmentId:appointments[0].id,resourceReleaseId,action:"PRESENT",context:{documentClass:"TRANSACTION_OVERVIEW"},at});
    if (!decision.allowed) return new NextResponse(null,{status:403,headers});
    return new NextResponse(paper.publicationHtml ?? TOV_PUBLICATION.html,{headers:{...headers,"Content-Type":"text/html; charset=utf-8","Content-Disposition":"inline","Content-Security-Policy":"default-src 'none'; img-src data:; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox"}});
  } catch { return new NextResponse(null,{status:503,headers}); }
}
