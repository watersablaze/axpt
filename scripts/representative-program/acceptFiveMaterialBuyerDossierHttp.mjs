import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const require = createRequire(import.meta.url);
const { projectFrenchWardInstitutionalProfile } = require(
  "../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile.ts"
);
assert.equal(typeof projectFrenchWardInstitutionalProfile, "function");

const { seedBafoulaSourceAuthorityWithClient } = require("../../src/domains/instruments/source-authority/seeds/seedBafoulaSourceAuthorityWithClient.ts");
const { SUPPORTING_DOCUMENTS } = require("../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog.ts");
const pdfDirectory=process.env.ARP_SUPPORTING_PDF_DIR;
assert.ok(pdfDirectory,"STOP: supporting PDF folder is required");
const fixtures=SUPPORTING_DOCUMENTS.map(publication=>{
 const file=path.join(pdfDirectory,publication.sourceFileName);const bytes=fs.readFileSync(file);
 assert.equal(bytes.length,publication.byteLength,"STOP: PDF size differs: "+publication.reference);
 assert.equal(createHash("sha256").update(bytes).digest("hex"),publication.sha256,"STOP: PDF checksum differs: "+publication.reference);
 return {publication,file,url:`https://zjlswvetvtzvn453.private.blob.vercel-storage.com/arp/supporting-publications/${publication.reference}/v${publication.version}/${publication.sha256}.pdf`};
});
const root = process.cwd();
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_buyer_dossier_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_BUYER_DOSSIER_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({datasources:{db:{url:url.href}}});
const prefix = "inv-http-" + randomUUID();
const actorId = prefix+"-actor", participantId=prefix+"-participant", instrumentId=prefix+"-instrument";
const partyId=prefix+"-party", appointmentId=prefix+"-appointment", packageId=prefix+"-pack", resourceId=prefix+"-resource";
const profile = projectFrenchWardInstitutionalProfile();
const port=3097, base="http://localhost:"+port;
const secret=randomBytes(48).toString("hex");
const env={...process.env,SIGNING_SECRET:secret,LOG_SECRET:randomBytes(48).toString("hex"),NODE_ENV:"development",
 RESEND_API_KEY:"re_local_inert_acceptance_key",BLOB_READ_WRITE_TOKEN:"",REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE:"log",
 REPRESENTATIVE_BUYER_DOSSIER_EMAIL_MODE:"log",REPRESENTATIVE_ONBOARDING_EMAIL_MODE:"log",REPRESENTATIVE_PROFILE_ADMIN_EMAILS:"admin@example.invalid"};
let temporary, server, output="";
function redact(value){let text=String(value||"");for(const key of [url.href,url.password,decodeURIComponent(url.password),secret,env.LOG_SECRET])if(key)text=text.split(key).join("[REDACTED]");return text.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi,"[REDACTED_CONNECTION]");}
function write(name,value){const target=path.join(temporary,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
function expose(name,exports){let source=path.relative(path.dirname(path.join(temporary,name)),path.join(root,name)).split(path.sep).join("/").replace(/\.tsx?$/,"");if(!source.startsWith("."))source="./"+source;write(name,`export { ${exports} } from ${JSON.stringify(source)};\n`+(exports==="default"?'export const dynamic="force-dynamic";\n':""));}
async function cookie(user){const tokenId=randomUUID();await client.session.create({data:{userId:user.id,tokenId,status:"active",expiresAt:new Date(Date.now()+3600000)}});const token=await new SignJWT({userId:user.id,email:user.email,tokenId,tier:"operations",roles:[],displayName:"Local fixture",popupMessage:"Local acceptance",greeting:"Welcome",partner:"AXPT",docs:[]}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));return "axpt_session="+token;}
async function request(route,body,session,origin=base){const response=await fetch(base+route,{method:body===undefined?"GET":"POST",headers:{...(session?{Cookie:session}:{}),...(body===undefined?{}:{"Content-Type":"application/json",Origin:origin})},body:body===undefined?undefined:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(90000)});const text=await response.text();return {response,text,data:response.headers.get("content-type")?.includes("application/json")?JSON.parse(text):null};}
async function stop(){if(!server||server.exitCode!==null||server.signalCode!==null)return;const done=new Promise(resolve=>server.once("exit",resolve));server.kill("SIGTERM");await Promise.race([done,new Promise(resolve=>setTimeout(resolve,5000))]);if(server.exitCode===null&&server.signalCode===null){server.kill("SIGKILL");await done;}}
async function main(){
  const identity = await client.$queryRaw`SELECT current_database() AS database`;
  assert.equal(identity[0].database, process.env.ARP_BUYER_DOSSIER_LOCAL_TEST);
  assert.equal(await client.user.count(), 0, "STOP: disposable database is not empty");
  await client.user.create({ data: {
    id: actorId, username: prefix, email: prefix + "-actor@example.invalid",
    passwordHash: "NOT_A_LOGIN_PASSWORD", displayName: "Local Representative", viewedDocs: [],
  } });
  await client.representativeProgramParticipant.create({ data: {
    id: participantId, userId: actorId, docketReference: prefix,
    displayName: "Local Representative", standing: "ACTIVE", createdByUserId: actorId,
  } });
  await client.institutionalInstrument.create({ data: {
    id: instrumentId, reference: prefix + "-APPT", title: "Local Appointment",
    kind: "REPRESENTATIVE_APPOINTMENT", status: "ACTIVE", createdByUserId: actorId,
  } });
  await client.instrumentParty.create({ data: {
    id: partyId, instrumentId, userId: actorId,
    displayName: "Local Representative", role: "COMMERCIAL_PARTICIPANT",
  } });
  await client.representativeProgramAppointment.create({ data: {
    id: appointmentId, participantId, instrumentId, instrumentPartyId: partyId,
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE", createdByUserId: actorId,
    effectiveAt: new Date(Date.now() - 60000),
  } });
  for (const key of ["ARP.INTRODUCTION", "ARP.COMMUNICATION"]) {
    await client.instrumentAuthority.create({ data: {
      instrumentId, authorityKey: key, title: key, action: key,
      authorityClass: "DELEGATED", holderPartyId: partyId,
      conditions: {}, effectiveAt: new Date(Date.now() - 60000), createdByUserId: actorId,
    } });
  }
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  const enumBlock = schema.match(/^enum CommercialUtilityPackModule \{([\s\S]*?)^\}/m);
  assert.ok(enumBlock);
  const modules = enumBlock[1].split(/\r?\n/).map(line => line.trim()).filter(line => /^[A-Z_]+$/.test(line));
  await client.commercialUtilityPack.create({ data: {
    id: packageId, participantId, reference: prefix + "-CUP", state: "CURRENT",
    releaseState: "PARTIAL", createdByUserId: actorId,
    modules: { create: modules.map(module => ({
      module: module, state: ["REPRESENTATION", "DOCUMENTS"].includes(module) ? "RELEASED" : "WITHHELD",
    })) },
  } });
  await client.commercialUtilityPackResourceRelease.create({ data: {
    id: resourceId, packageId, module: "REPRESENTATION", resourceType: "STRUCTURED_CONTENT",
    resourceId: profile.reference, state: "RELEASED", canView: true, canTransmit: false,
  } });

 await client.commercialUtilityPackResourceRelease.update({where:{id:resourceId},data:{canTransmit:true}});
 const seeded=await seedBafoulaSourceAuthorityWithClient({client,actorUserId:actorId});
 const sourceResourceId=prefix+"-source-resource";
 await client.commercialUtilityPackResourceRelease.create({data:{id:sourceResourceId,packageId,module:"DOCUMENTS",resourceType:"INSTITUTIONAL_INSTRUMENT",resourceId:seeded.instrument.id,state:"RELEASED",canView:true,canTransmit:true,label:"Bafoula Source Authority"}});

 const supportingIds=[];
 for(const fixture of fixtures){
  const publication=fixture.publication;const id=prefix+"-"+publication.kind;supportingIds.push(id);
  await client.commercialUtilityPackResourceRelease.create({data:{id,packageId,module:"DOCUMENTS",resourceType:"DOCUMENT",resourceId:publication.reference,
   label:publication.title,state:"RELEASED",canView:true,canTransmit:true,canDownload:false,
   metadata:{publicationVersion:publication.version,sha256:publication.sha256,byteLength:publication.byteLength,mimeType:"application/pdf",sourceFileName:publication.sourceFileName,fileUrl:fixture.url}}});
 }
 const actor=await client.user.findUniqueOrThrow({where:{id:actorId}});
 const admin=await client.user.create({data:{username:prefix+"-admin",email:prefix+"-admin@example.invalid",passwordHash:"INERT",displayName:"Local Admin",viewedDocs:[]}});
 const role=await client.role.create({data:{key:"ADMIN_PLATFORM",label:"Local Administrator"}});
 await client.userRole.create({data:{userId:admin.id,roleId:role.id}});
 const actorCookie=await cookie(actor),adminCookie=await cookie(admin);
 await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once("error",reject);probe.listen(port,"127.0.0.1",()=>probe.close(resolve));});
 temporary=fs.mkdtempSync(path.join(root,".arp-invitation-http-"));
 for(const name of ["node_modules","src","public"])fs.symlinkSync(path.join(root,name),path.join(temporary,name),"dir");
 write("package.json",JSON.stringify({private:true}));
 write("tsconfig.json",JSON.stringify({compilerOptions:{target:"ES2022",module:"ESNext",moduleResolution:"bundler",jsx:"react-jsx",esModuleInterop:true,baseUrl:".",paths:{"@/*":["src/*"]}}}));
 const readsFile=path.join(temporary,"fixture-storage-reads.log");
 write("fixture-storage.ts",`import fs from "node:fs";
 const fixtures=${JSON.stringify(fixtures.map(entry=>({url:entry.url,file:entry.file})))};
 export async function readPrivateSupportingBlob(url:string,maximumBytes:number){
   const fixture=fixtures.find(entry=>entry.url===url);if(!fixture)throw new Error("TEST_STORAGE_LOCATOR_REJECTED");
   fs.appendFileSync(${JSON.stringify(readsFile)},url+"\\n");
   const bytes=fs.readFileSync(fixture.file);if(bytes.length!==maximumBytes)throw new Error("TEST_STORAGE_SIZE_DIFFERS");return bytes;
 }`);
 write("next.config.mjs",`export default {experimental:{externalDir:true},webpack(config,{webpack}){
 config.plugins.push(new webpack.NormalModuleReplacementPlugin(/readPrivateSupportingBlob(?:\\.ts)?$/,resource=>{
   resource.request=${JSON.stringify(path.join(temporary,"fixture-storage.ts"))};
 }));return config;}};`);
 write("app/layout.tsx","export default function Layout({children}) {return <html><body>{children}</body></html>;}\n");
 expose("app/api/representative/buyer-dossiers/route.ts","GET, POST");
 expose("app/api/auth/login/verify/route.ts","POST");
 expose("app/transaction-intake/page.tsx","default");
 expose("app/french-ward/transaction-intake/page.tsx","default");
 expose("app/api/transaction-intake/route.ts","POST");
 expose("app/api/french-ward/dossiers/[dossierId]/publications/[itemId]/document/route.ts","GET");
 expose("app/api/representative/commercial-utility-packs/resources/[resourceReleaseId]/supporting-document/route.ts","GET");
 expose("app/api/admin/representative-program/participants/[participantId]/workspace-preview/resources/[resourceReleaseId]/supporting-document/route.ts","GET");

 expose("app/french-ward/dossiers/[dossierId]/page.tsx","default");
 expose("app/french-ward/dossiers/[dossierId]/publications/[itemId]/page.tsx","default");
 expose("app/admin/representative-program/buyer-dossiers/page.tsx","default");
 write("app/api/acceptance-health/route.ts",'import {prisma} from "@/infrastructure/db/prisma"; export async function GET(){const rows=await prisma.$queryRaw`SELECT current_database() AS database`;return Response.json({database:rows[0].database,host:new URL(process.env.DATABASE_URL).hostname});}');
 server=spawn(process.execPath,[require.resolve("next/dist/bin/next"),"dev",temporary,"--webpack","--hostname","127.0.0.1","--port",String(port)],{cwd:temporary,env,stdio:["ignore","pipe","pipe"]});
 const capture=chunk=>{output=(output+redact(chunk)).slice(-18000);};server.stdout.on("data",capture);server.stderr.on("data",capture);server.on("error",capture);
 let ready=false;for(let i=0;i<90;i++){if(server.exitCode!==null||server.signalCode!==null)throw new Error("Local server exited");try{const response=await fetch(base+"/api/acceptance-health",{signal:AbortSignal.timeout(3000)});if(response.ok){const data=await response.json();assert.equal(data.database,process.env.ARP_BUYER_DOSSIER_LOCAL_TEST);assert.equal(data.host,"127.0.0.1");ready=true;break;}}catch(error){if(error instanceof assert.AssertionError)throw error;}await new Promise(resolve=>setTimeout(resolve,1000));}assert.ok(ready,"Local server readiness timed out");
 console.log("✓ HTTP server database identity verified; invitation log mode active.");
 const route="/api/representative/buyer-dossiers";
 const selectedIds=[resourceId,sourceResourceId,...supportingIds];
 const query="?"+new URLSearchParams(selectedIds.map(id=>["resourceReleaseId",id]));
 assert.equal((await request(route+query)).response.status,401);
 const review=await request(route+query,undefined,actorCookie);
 assert.equal(review.response.status,200,JSON.stringify(review.data));assert.ok(review.data.review.allowed);
 assert.equal(review.data.review.publications.length,5);
 const fields={resourceReleaseIds:selectedIds,reviewHash:review.data.review.reviewHash,recipientName:"HTTP Buyer",recipientEmail:prefix+"-visitor@example.invalid",recipientOrganization:"HTTP QA",purpose:"PRIVATE_OPERATOR_PURPOSE_"+prefix,idempotencyKey:randomUUID()};
 assert.equal((await request(route,fields)).response.status,401);
 assert.equal((await request(route,fields,actorCookie,"https://example.invalid")).response.status,403);
 assert.equal((await request(route,{...fields,scope:"LOI_INTAKE_ACCESS"},actorCookie)).response.status,400);
 assert.equal((await request(route,{...fields,reviewHash:"0".repeat(64)},actorCookie)).response.status,409);
 assert.equal(await client.institutionalAccessGrant.count(),0);
 const sent=await request(route,fields,actorCookie);assert.equal(sent.response.status,202,JSON.stringify(sent.data));assert.ok(sent.data.ok);
 assert.equal(sent.data.receipt.recipientDeliveryStatus,"LOGGED_ONLY");assert.equal(sent.data.receipt.adminDeliveryStatus,"LOGGED_ONLY");
 const dossier=await client.representativeBuyerDossier.findUniqueOrThrow({where:{id:sent.data.dossierId},include:{items:true}});
 const again=await request(route,{...fields,resourceReleaseIds:[...selectedIds].reverse()},actorCookie);assert.equal(again.data.dossierId,dossier.id);
 assert.equal((await request(route,{...fields,purpose:"Changed"},actorCookie)).response.status,409);
 assert.equal(await client.institutionalAccessGrant.count(),5);assert.equal(await client.representativeBuyerDossier.count(),1);
 assert.equal((await request(route+"?dossierId="+dossier.id,undefined,adminCookie)).response.status,404);
 console.log("✓ Actual combined invitation API enforces session, origin, strict fields, reviewed selection, ownership and replay; both channels logged only.");
 const visitor=await client.user.findUniqueOrThrow({where:{id:dossier.recipientUserId}});
 const pin="637291";await client.pinLoginRequest.create({data:{email:visitor.email,pinHash:await bcrypt.hash(pin,12),expiresAt:new Date(Date.now()+600000)}});
 const login=await request("/api/auth/login/verify",{email:visitor.email,pin});assert.equal(login.response.status,200,JSON.stringify(login.data));assert.equal(login.data.audience,"INSTITUTIONAL_VISITOR");
 const set=login.response.headers.getSetCookie().find(value=>value.startsWith("axpt_session="));assert.ok(set);assert.match(set,/HttpOnly/i);const visitorCookie=set.split(";")[0];
 const reception="/french-ward/dossiers/"+dossier.id;
 const anonymous=await request(reception);assert.equal(anonymous.response.status,307);assert.ok(anonymous.response.headers.get("location").includes("/login?next="));
 const opened=await request(reception,undefined,visitorCookie);assert.equal(opened.response.status,200);assert.ok(opened.text.includes("Your French-Ward documents"));
 assert.ok(!opened.text.includes(fields.purpose));
 for(const item of dossier.items){
   const publication=await request(reception+"/publications/"+item.id,undefined,visitorCookie);
   assert.equal(publication.response.status,200,item.kind);assert.ok(publication.text.includes(item.resourceReference));
   const markers=item.kind==="INSTITUTIONAL_PROFILE"?['id="fw-leadership-heading"','id="fw-corporate-coordinates"']:item.kind==="SOURCE_AUTHORITY"?['aria-label="Source Authority Instrument contents"']:['<iframe'];
   for(const marker of markers)assert.ok(publication.text.includes(marker),item.kind+": missing "+marker);
   assert.ok(!publication.text.includes("Invite to View Profile"));assert.ok(!publication.text.includes("Open Workspace Preview"));assert.ok(!publication.text.includes(fields.purpose));
   assert.equal((await request(reception+"/publications/"+item.id,undefined,actorCookie)).response.status,404);
 }
 assert.equal((await request(reception+"/publications/not-an-item",undefined,visitorCookie)).response.status,404);
 const storageReads=()=>fs.existsSync(readsFile)?fs.readFileSync(readsFile,"utf8").trim().split("\n").filter(Boolean).length:0;
 async function pdf(route,session){
  const response=await fetch(base+route,{headers:session?{Cookie:session}:{},redirect:"manual",signal:AbortSignal.timeout(90000)});
  return {response,bytes:Buffer.from(await response.arrayBuffer())};
 }
 for(const fixture of fixtures){
  const item=dossier.items.find(entry=>entry.kind===fixture.publication.kind);assert.ok(item);
  const resource=dossier.items.find(entry=>entry.kind===fixture.publication.kind).resourceReleaseId;
  const endpoint="/api/french-ward/dossiers/"+dossier.id+"/publications/"+item.id+"/document";
  let before=storageReads();
  assert.equal((await pdf(endpoint)).response.status,401);
  assert.equal((await pdf(endpoint,actorCookie)).response.status,404);
  assert.equal((await pdf(endpoint+"?mode=download",visitorCookie)).response.status,404);
  assert.equal(storageReads(),before,"Denied recipient request reached storage");
  const openedPdf=await pdf(endpoint,visitorCookie);assert.equal(openedPdf.response.status,200,item.kind);
  assert.match(openedPdf.response.headers.get("content-type"),/application\/pdf/);
  assert.match(openedPdf.response.headers.get("content-disposition"),/^inline;/);
  assert.match(openedPdf.response.headers.get("cache-control"),/no-store/);
  assert.equal(createHash("sha256").update(openedPdf.bytes).digest("hex"),fixture.publication.sha256);
  const repEndpoint="/api/representative/commercial-utility-packs/resources/"+resource+"/supporting-document";
  assert.equal((await pdf(repEndpoint,actorCookie)).response.status,200);
  before=storageReads();assert.equal((await pdf(repEndpoint+"?mode=download",actorCookie)).response.status,404);
  assert.equal((await pdf(repEndpoint,visitorCookie)).response.status,404);assert.equal(storageReads(),before);
  const adminEndpoint="/api/admin/representative-program/participants/"+participantId+"/workspace-preview/resources/"+resource+"/supporting-document";
  assert.equal((await pdf(adminEndpoint,adminCookie)).response.status,200);
  before=storageReads();assert.equal((await pdf(adminEndpoint,visitorCookie)).response.status,403);
  assert.equal((await pdf(adminEndpoint+"?mode=download",adminCookie)).response.status,403);assert.equal(storageReads(),before);
  await client.institutionalAccessGrant.update({where:{id:item.grantId},data:{revokedAt:new Date()}});
  assert.equal((await pdf(endpoint,visitorCookie)).response.status,404);assert.equal(storageReads(),before);
  await client.institutionalAccessGrant.update({where:{id:item.grantId},data:{revokedAt:null}});
  await client.commercialUtilityPackResourceRelease.update({where:{id:resource},data:{state:"WITHDRAWN"}});
  assert.equal((await pdf(endpoint,visitorCookie)).response.status,404);assert.equal(storageReads(),before);
  await client.commercialUtilityPackResourceRelease.update({where:{id:resource},data:{state:"RELEASED"}});
 }
 console.log("✓ All three actual PDF endpoints return exact original bytes; wrong identity, downloads, withdrawal and revoked grants deny before storage.");

 assert.equal((await request("/api/auth/login/verify",{email:visitor.email,pin})).response.status,401);
 assert.equal((await request(route,fields,visitorCookie)).response.status,403);
 const register=await request("/admin/representative-program/buyer-dossiers",undefined,adminCookie);assert.equal(register.response.status,200);assert.ok(register.text.includes(fields.recipientEmail));assert.ok(register.text.includes("LOGGED_ONLY"));assert.ok(register.text.includes(fields.purpose));
 assert.equal((await request("/admin/representative-program/buyer-dossiers",undefined,visitorCookie)).response.status,404);
 console.log("✓ Real PIN verification opens the buyer reception and both full publications, excludes private operator notes and rejects representative/Admin actions.");
 const sourceItem=dossier.items.find(item=>item.kind==="SOURCE_AUTHORITY");const profileItem=dossier.items.find(item=>item.kind==="INSTITUTIONAL_PROFILE");assert.ok(sourceItem&&profileItem);
 await client.institutionalAccessGrant.update({where:{id:sourceItem.grantId},data:{revokedAt:new Date()}});
 assert.equal((await request(reception+"/publications/"+sourceItem.id,undefined,visitorCookie)).response.status,404);
 assert.equal((await request(reception+"/publications/"+profileItem.id,undefined,visitorCookie)).response.status,200);
 await client.institutionalAccessGrant.update({where:{id:sourceItem.grantId},data:{revokedAt:null}});
 await client.representativeBuyerDossier.update({where:{id:dossier.id},data:{expiresAt:new Date(0)}});
 assert.equal((await request(reception,undefined,visitorCookie)).response.status,404);
 assert.equal((await request(reception+"/publications/"+profileItem.id,undefined,visitorCookie)).response.status,404);
 assert.equal(await client.emailLog.count(),2);
 console.log("✓ Per-publication revocation and dossier expiry are enforced through the existing recipient session.");
 const loiReview=await request(route+query+"&includeLoiAccess=true",undefined,actorCookie);
 assert.equal(loiReview.response.status,200);assert.ok(loiReview.data.review.loiAccess);
 assert.notEqual(loiReview.data.review.reviewHash,review.data.review.reviewHash);
 assert.equal((await request(route+query+"&includeLoiAccess=invalid",undefined,actorCookie)).response.status,400);
 assert.equal((await request(route,{...fields,includeLoiAccess:"true"},actorCookie)).response.status,400);
 const loiFields={...fields,includeLoiAccess:true,reviewHash:loiReview.data.review.reviewHash,
   recipientEmail:prefix+"-loi-visitor@example.invalid",idempotencyKey:randomUUID()};
 assert.equal((await request(route,{...loiFields,reviewHash:review.data.review.reviewHash},actorCookie)).response.status,409);
 const loiSent=await request(route,loiFields,actorCookie);assert.equal(loiSent.response.status,202,JSON.stringify(loiSent.data));
 const loiDossier=await client.representativeBuyerDossier.findUniqueOrThrow({where:{id:loiSent.data.dossierId}});
 assert.ok(loiDossier.loiAccessGrantId);
 const loiUser=await client.user.findUniqueOrThrow({where:{id:loiDossier.recipientUserId}});
 await client.pinLoginRequest.create({data:{email:loiUser.email,pinHash:await bcrypt.hash("581924",12),expiresAt:new Date(Date.now()+600000)}});
 const loiLogin=await request("/api/auth/login/verify",{email:loiUser.email,pin:"581924"});assert.equal(loiLogin.response.status,200);
 const loiCookie=loiLogin.response.headers.getSetCookie().find(value=>value.startsWith("axpt_session=")).split(";")[0];
 const loiReception=await request("/french-ward/dossiers/"+loiDossier.id,undefined,loiCookie);
 assert.equal(loiReception.response.status,200);assert.ok(loiReception.text.includes("LOI access is included"));
 const form=await request("/french-ward/transaction-intake",undefined,loiCookie);
 assert.equal(form.response.status,200);assert.ok(form.text.includes('name="submitterName"'));
 const savedForm="/french-ward/transaction-intake";
 const blockedBody={submitterName:"HTTP Buyer",submitterEmail:loiUser.email,submitterRole:"BUYER",
   declarationAccuracy:true,declarationNoObligation:true,declarationNoCommission:true};
 const intakes=await client.transactionIntake.count();
 await client.representativeBuyerDossier.update({where:{id:loiDossier.id},data:{revokedAt:new Date()}});
 const blockedForm=await request(savedForm,undefined,loiCookie);assert.equal(blockedForm.response.status,200);
 assert.ok(!blockedForm.text.includes('name="submitterName"'));
 assert.equal((await request("/api/transaction-intake",blockedBody,loiCookie)).response.status,403);
 assert.equal(await client.transactionIntake.count(),intakes);
 console.log("✓ Actual opt-in API review and PIN session open the LOI form; saved form and submission deny after dossier revocation, without sending mail.");
 console.log("ARP_FIVE_MATERIAL_PDF_HTTP_OK");
}
main().catch(error=>{console.error(redact(error.stack || error.message));if(output)console.error(output);process.exitCode=1;}).finally(async()=>{await stop();await client.$disconnect();if(temporary)fs.rmSync(temporary,{recursive:true,force:true});});
