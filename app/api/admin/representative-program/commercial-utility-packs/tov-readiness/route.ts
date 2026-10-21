import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { createHash } from "node:crypto";
import { commercialPapers, commercialPaperPinMatches } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = {"Cache-Control":"private, no-store, max-age=0", "X-Content-Type-Options":"nosniff", "Referrer-Policy":"no-referrer"};
type ReadTransaction = Pick<PrismaClient, "$executeRaw" | "institutionalInstrument" | "representativeOnboardingIntake" | "commercialUtilityPack">;
type ReportResource = {id:string;resourceType:string;state:string;canView:boolean;canDownload:boolean;canPresent:boolean;canTransmit:boolean;metadata:unknown};
type ReportPack = {id:string;reference:string;state:string;releaseState:string;modules:Array<{module:string;state:string}>;resources:ReportResource[]};
function redact(value: string) {
  let result = value;
  for (const [key, secret] of Object.entries(process.env)) {
    if (secret && /DATABASE|PASSWORD|SECRET|TOKEN|API_KEY|DSN/i.test(key)) {
      result = result.split(secret).join("[REDACTED]");
      if (/DATABASE|DSN/i.test(key)) try {
        const url = new URL(secret);
        for (const credential of [url.username, url.password]) if (credential) {
          result = result.split(credential).join("[REDACTED]");
          result = result.split(decodeURIComponent(credential)).join("[REDACTED]");
        }
      } catch { /* No connection value is required for the runtime report. */ }
    }
  }
  return result.replace(/(?:postgres(?:ql)?|https?):\/\/[^\s"'`]+/gi,"[REDACTED_URL]").slice(-1800);
}

/** Read-only operator report using the SAME Prisma singleton as the active admin workspace.
 * Never load dotenv, instantiate another client, disconnect the shared client, or mutate records here.
 */
export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ok:false},{status:401,headers});
  if (!isAdmin(principal)) return NextResponse.json({ok:false},{status:403,headers});
  const query = new URL(request.url).searchParams;
  const intakeReference = query.get("intakeReference") || "FWI-26-RP-ONB-CFCC47E131";
  if ([...query.keys()].some(key=>key!=="intakeReference") || query.getAll("intakeReference").length>1 ||
      !/^[A-Za-z0-9-]{1,191}$/.test(intakeReference)) return NextResponse.json({ok:false},{status:400,headers});
  let step = "checking publication integrity";
  try {
    const paper = commercialPapers().find(p=>p.key==="TRANSACTION_OVERVIEW");
    if (!paper || commercialPapers().filter(p=>p.reference===paper.reference).length!==1) throw new Error("TOV source reference conflict");
    let databaseFingerprint: string | null = null;
    try {
      const url = new URL(process.env.DATABASE_URL || "");
      databaseFingerprint = createHash("sha256").update(url.hostname+":"+url.port+url.pathname).digest("hex").slice(0,12);
    } catch { /* The canonical Prisma singleton owns connection configuration; this is informational only. */ }
    step = "opening database transaction";
    const report = await prisma.$transaction(async (tx: ReadTransaction) => {
      step = "setting transaction read-only";
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      step = "checking reference conflicts";
      const collisions = await tx.institutionalInstrument.findMany({where:{reference:paper.reference},select:{id:true,reference:true,kind:true,status:true,currentVersion:true},take:2});
      step = "reading target intake and appointment";
      const intake = await tx.representativeOnboardingIntake.findUnique({where:{reference:intakeReference},select:{reference:true,status:true,candidateDisplayName:true,candidateEmail:true,admittedParticipant:{select:{id:true,docketReference:true,displayName:true,standing:true,userId:true,user:{select:{email:true}},appointments:{select:{id:true,effectiveAt:true,expiresAt:true,endedAt:true,instrument:{select:{reference:true,status:true,authorities:{select:{authorityKey:true,action:true,conditions:true,effectiveAt:true,expiresAt:true,revokedAt:true}}}}}}}}}});
      step = "reading CUP state";
      const packs: ReportPack[] = intake?.admittedParticipant ? await tx.commercialUtilityPack.findMany({where:{participantId:intake.admittedParticipant.id,version:1},select:{id:true,reference:true,state:true,releaseState:true,modules:{select:{module:true,state:true}},resources:{where:{resourceId:paper.reference},select:{id:true,resourceType:true,state:true,canView:true,canDownload:true,canPresent:true,canTransmit:true,metadata:true}}},take:2}) : [];
      return {referenceCheck:{sourceCatalogUnique:true,conflictingInstrumentRecords:collisions,establishesDatabaseRegistration:false},intake,packs:packs.map(pack=>({...pack,resources:pack.resources.map(resource=>({...resource,metadata:undefined,currentEditionPinMatches:commercialPaperPinMatches(resource.metadata,paper)}))}))};
    },{maxWait:10000,timeout:30000});
    return NextResponse.json({ok:true,inspection:"READ_ONLY_TOV_RELEASE_READINESS",source:"ACTIVE_ADMIN_RUNTIME",
      inspectedAt:new Date().toISOString(),databaseFingerprint,reference:paper.reference,version:paper.version,status:paper.status,
      contentHash:paper.contentHash,publicationHash:paper.publicationHash,...report,establishesRelease:false,establishesAuthority:false}, {headers});
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error("Unknown readiness failure");
    const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : null;
    return NextResponse.json({ok:false,inspection:"READ_ONLY_TOV_RELEASE_READINESS_FAILED",source:"ACTIVE_ADMIN_RUNTIME",
      step,name:error.name,code,message:redact(error.message),releaseAttempted:false,emailAttempted:false},{status:503,headers});
  }
}
