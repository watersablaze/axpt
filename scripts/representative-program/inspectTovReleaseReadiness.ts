import { config as loadEnvironment } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { commercialPapers, commercialPaperPinMatches } from "../../src/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";

type ReadTransaction = Pick<PrismaClient, "$executeRaw" | "institutionalInstrument" | "representativeOnboardingIntake" | "commercialUtilityPack">;
type ReportResource = {id:string;resourceType:string;state:string;canView:boolean;canDownload:boolean;canPresent:boolean;canTransmit:boolean;metadata:unknown};
type ReportPack = {id:string;reference:string;state:string;releaseState:string;modules:Array<{module:string;state:string}>;resources:ReportResource[]};

let readinessStep = "startup";
function redactReadinessError(value: string): string {
  let result = value;
  for (const [key, secret] of Object.entries(process.env)) {
    if (secret && /DATABASE|PASSWORD|SECRET|TOKEN|API_KEY|DSN/i.test(key)) {
      result = result.split(secret).join("[REDACTED]");
      if (/DATABASE|DSN/i.test(key)) {
        try {
          const connection = new URL(secret);
          for (const credential of [connection.username, connection.password]) {
            if (credential) {
              result = result.split(credential).join("[REDACTED]");
              result = result.split(decodeURIComponent(credential)).join("[REDACTED]");
            }
          }
        } catch { /* An environment value need not be a URL. */ }
      }
    }
  }
  return result.replace(/(?:postgres(?:ql)?|https?):\/\/[^\s"'`]+/gi, "[REDACTED_URL]").slice(-2400);
}

async function main() {
  readinessStep = "loading environment";
  const environment = process.env.NODE_ENV || "development";
  loadEnvironment({
    path: [
      `.env.${environment}.local`,
      ...(environment === "test" ? [] : [".env.local"]),
      `.env.${environment}`,
      ".env",
    ],
    override: false,
    quiet: true,
  });
  readinessStep = "validating DATABASE_URL";
  const url = new URL(process.env.DATABASE_URL || "");
  const databaseFingerprint = createHash("sha256").update(url.hostname + ":" + url.port + url.pathname).digest("hex").slice(0,12);
  const intakeReference = process.argv[2] || "FWI-26-RP-ONB-CFCC47E131";
  if (!/^[A-Za-z0-9-]{1,191}$/.test(intakeReference)) throw new Error("Invalid intake reference");
  readinessStep = "checking publication integrity";
  const paper = commercialPapers().find(p => p.key === "TRANSACTION_OVERVIEW")!;
  if (commercialPapers().filter(p => p.reference === paper.reference).length !== 1) throw new Error("Source registry reference conflict");
  readinessStep = "initializing Prisma client";
  const client = new PrismaClient({errorFormat: "minimal"});
  try {
    readinessStep = "opening database transaction";
    const report = await client.$transaction(async (tx: ReadTransaction) => {
      readinessStep = "setting transaction read-only";
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      readinessStep = "checking reference conflicts";
      const collisions = await tx.institutionalInstrument.findMany({where:{reference:paper.reference},select:{id:true,reference:true,kind:true,status:true,currentVersion:true},take:2});
      readinessStep = "reading target intake and appointment";
      const intake = await tx.representativeOnboardingIntake.findUnique({where:{reference:intakeReference},select:{reference:true,status:true,candidateDisplayName:true,candidateEmail:true,admittedParticipant:{select:{id:true,docketReference:true,displayName:true,standing:true,userId:true,user:{select:{email:true}},appointments:{select:{id:true,effectiveAt:true,expiresAt:true,endedAt:true,instrument:{select:{reference:true,status:true,authorities:{select:{authorityKey:true,action:true,conditions:true,effectiveAt:true,expiresAt:true,revokedAt:true}}}}}}}}}});
      readinessStep = "reading CUP state";
      const packs: ReportPack[] = intake?.admittedParticipant ? await tx.commercialUtilityPack.findMany({where:{participantId:intake.admittedParticipant.id,version:1},select:{id:true,reference:true,state:true,releaseState:true,modules:{select:{module:true,state:true}},resources:{where:{resourceId:paper.reference},select:{id:true,resourceType:true,state:true,canView:true,canDownload:true,canPresent:true,canTransmit:true,metadata:true}}},take:2}) : [];
      return {referenceCheck:{sourceCatalogUnique:true,conflictingInstrumentRecords:collisions,establishesDatabaseRegistration:false},intake,packs:packs.map(pack=>({...pack,resources:pack.resources.map(resource=>({...resource,metadata:undefined,currentEditionPinMatches:commercialPaperPinMatches(resource.metadata,paper)}))}))};
    },{maxWait:10000,timeout:30000});
    console.log(JSON.stringify({inspection:"READ_ONLY_TOV_RELEASE_READINESS",databaseFingerprint,reference:paper.reference,version:paper.version,status:paper.status,contentHash:paper.contentHash,publicationHash:paper.publicationHash,...report,establishesRelease:false,establishesAuthority:false},null,2));
  } finally { await client.$disconnect(); }
}
main().catch((cause: unknown) => {
  const error = cause instanceof Error ? cause : new Error("Unknown readiness failure");
  const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : null;
  console.error(JSON.stringify({inspection:"READ_ONLY_TOV_RELEASE_READINESS_FAILED",step:readinessStep,
    name:error.name,code,message:redactReadinessError(error.message),releaseAttempted:false,emailAttempted:false},null,2));
  process.exitCode=1;
});
