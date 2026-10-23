import {createHash} from "node:crypto";
import type {PrismaClient} from "@prisma/client";
type InspectionTransaction = Pick<PrismaClient,
  "$executeRawUnsafe" | "representativeBuyerDossier" | "institutionalAccessGrant">;
type AccessWindow = {revokedAt: Date | null; expiresAt: Date};
import {NextResponse} from "next/server";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {prisma} from "@/infrastructure/db/prisma";
import {projectFrenchWardInstitutionalProfile} from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
export async function GET(){
 const principal=await getPrincipal();
 if(!principal)return NextResponse.json({ok:false},{status:401,headers});
 if(!isAdmin(principal))return NextResponse.json({ok:false},{status:403,headers});
 try{
  const profile=projectFrenchWardInstitutionalProfile();const now=new Date();
  const result=await prisma.$transaction(async (tx: InspectionTransaction)=>{
   await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
   const dossiers=await tx.representativeBuyerDossier.findMany({where:{items:{some:{resourceReference:profile.reference}}},select:{id:true,expiresAt:true,revokedAt:true,items:{where:{resourceReference:profile.reference},select:{resourceVersion:true,recipientContentHash:true}}}});
   const grants=await tx.institutionalAccessGrant.findMany({where:{resourceReference:profile.reference},select:{scope:true,resourceVersion:true,expiresAt:true,revokedAt:true}});
   return {dossiers:dossiers.map((row: AccessWindow)=>({...row,active:!row.revokedAt&&row.expiresAt>now})),grants:grants.map((row: AccessWindow)=>({...row,active:!row.revokedAt&&row.expiresAt>now}))};
  });
  const connection=new URL(process.env.DATABASE_URL!);
  const target={host:connection.hostname.replace(/-pooler(?=\.)/,""),port:connection.port||"5432",database:connection.pathname,schema:connection.searchParams.get("schema")||"public"};
  return NextResponse.json({ok:true,inspection:"READ_ONLY_PROFILE_CONTINUITY",source:"ACTIVE_ADMIN_RUNTIME",environment:process.env.VERCEL_ENV||"local",databaseTargetHash:createHash("sha256").update(JSON.stringify(target)).digest("hex"),inspectedAt:now.toISOString(),reference:profile.reference,version:profile.version,contentHash:createHash("sha256").update(JSON.stringify(profile)).digest("hex"),...result,databaseChanged:false,emailAttempted:false},{headers});
 }catch{return NextResponse.json({ok:false,inspection:"READ_ONLY_PROFILE_CONTINUITY_FAILED",databaseChanged:false,emailAttempted:false},{status:503,headers});}
}
