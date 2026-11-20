import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { randomUUID, randomBytes } from "node:crypto";
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

const root = process.cwd();
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_profile_inv_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_PROFILE_INVITATION_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({datasources:{db:{url:url.href}}});
const prefix = "inv-http-" + randomUUID();
const actorId = prefix+"-actor", participantId=prefix+"-participant", instrumentId=prefix+"-instrument";
const partyId=prefix+"-party", appointmentId=prefix+"-appointment", packageId=prefix+"-pack", resourceId=prefix+"-resource";
const profile = projectFrenchWardInstitutionalProfile();
const port=3097, base="http://localhost:"+port;
const secret=randomBytes(48).toString("hex");
const env={...process.env,SIGNING_SECRET:secret,LOG_SECRET:randomBytes(48).toString("hex"),NODE_ENV:"development",
 RESEND_API_KEY:"re_local_inert_acceptance_key",REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE:"log",
 REPRESENTATIVE_ONBOARDING_EMAIL_MODE:"log",REPRESENTATIVE_PROFILE_ADMIN_EMAILS:"admin@example.invalid"};
let temporary, server, output="";
function redact(value){let text=String(value||"");for(const key of [url.href,url.password,decodeURIComponent(url.password),secret,env.LOG_SECRET])if(key)text=text.split(key).join("[REDACTED]");return text.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi,"[REDACTED_CONNECTION]");}
function write(name,value){const target=path.join(temporary,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
function expose(name,exports){let source=path.relative(path.dirname(path.join(temporary,name)),path.join(root,name)).split(path.sep).join("/").replace(/\.tsx?$/,"");if(!source.startsWith("."))source="./"+source;write(name,`export { ${exports} } from ${JSON.stringify(source)};\n`+(exports==="default"?'export const dynamic="force-dynamic";\n':""));}
async function cookie(user){const tokenId=randomUUID();await client.session.create({data:{userId:user.id,tokenId,status:"active",expiresAt:new Date(Date.now()+3600000)}});const token=await new SignJWT({userId:user.id,email:user.email,tokenId,tier:"operations",roles:[],displayName:"Local fixture",popupMessage:"Local acceptance",greeting:"Welcome",partner:"AXPT",docs:[]}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));return "axpt_session="+token;}
async function request(route,body,session,origin=base){const response=await fetch(base+route,{method:body===undefined?"GET":"POST",headers:{...(session?{Cookie:session}:{}),...(body===undefined?{}:{"Content-Type":"application/json",Origin:origin})},body:body===undefined?undefined:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(90000)});const text=await response.text();return {response,text,data:response.headers.get("content-type")?.includes("application/json")?JSON.parse(text):null};}
async function stop(){if(!server||server.exitCode!==null||server.signalCode!==null)return;const done=new Promise(resolve=>server.once("exit",resolve));server.kill("SIGTERM");await Promise.race([done,new Promise(resolve=>setTimeout(resolve,5000))]);if(server.exitCode===null&&server.signalCode===null){server.kill("SIGKILL");await done;}}
async function main(){
  const identity = await client.$queryRaw`SELECT current_database() AS database`;
  assert.equal(identity[0].database, process.env.ARP_PROFILE_INVITATION_LOCAL_TEST);
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
      module: module, state: module === "REPRESENTATION" ? "RELEASED" : "WITHHELD",
    })) },
  } });
  await client.commercialUtilityPackResourceRelease.create({ data: {
    id: resourceId, packageId, module: "REPRESENTATION", resourceType: "STRUCTURED_CONTENT",
    resourceId: profile.reference, state: "RELEASED", canView: true, canTransmit: false,
  } });

 await client.commercialUtilityPackResourceRelease.update({where:{id:resourceId},data:{canTransmit:true}});
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
 write("next.config.mjs","export default { experimental: { externalDir: true } };\n");
 write("app/layout.tsx","export default function Layout({children}) {return <html><body>{children}</body></html>;}\n");
 expose("app/api/representative/commercial-utility-packs/resources/[resourceReleaseId]/profile/invite/route.ts","GET, POST");
 {
   const name = "app/api/representative/commercial-utility-packs/resources/[resourceReleaseId]/profile/invite/route.ts";
   const target = path.join(temporary, name);
   const wrapper = fs.readFileSync(target, "utf8").replace(
     "export { GET, POST }",
     "import { GET, POST as actualPOST }"
   );
   fs.writeFileSync(target, wrapper + `
export { GET };
export async function POST(request, context) {
  console.log("LOCAL_ORIGIN_DIAGNOSTIC", {
    urlOrigin: new URL(request.url).origin,
    suppliedOrigin: request.headers.get("origin"),
    host: request.headers.get("host")
  });
  return actualPOST(request, context);
}
`);
 }

 expose("app/api/auth/login/verify/route.ts","POST");
 expose("app/french-ward/profile/page.tsx","default");
 expose("app/admin/representative-program/profile-introductions/page.tsx","default");
 write("app/api/acceptance-health/route.ts",'import {prisma} from "@/infrastructure/db/prisma"; export async function GET(){const rows=await prisma.$queryRaw`SELECT current_database() AS database`;return Response.json({database:rows[0].database,host:new URL(process.env.DATABASE_URL).hostname});}');
 server=spawn(process.execPath,[require.resolve("next/dist/bin/next"),"dev",temporary,"--webpack","--hostname","127.0.0.1","--port",String(port)],{cwd:temporary,env,stdio:["ignore","pipe","pipe"]});
 const capture=chunk=>{output=(output+redact(chunk)).slice(-18000);};server.stdout.on("data",capture);server.stderr.on("data",capture);server.on("error",capture);
 let ready=false;for(let i=0;i<90;i++){if(server.exitCode!==null||server.signalCode!==null)throw new Error("Local server exited");try{const response=await fetch(base+"/api/acceptance-health",{signal:AbortSignal.timeout(3000)});if(response.ok){const data=await response.json();assert.equal(data.database,process.env.ARP_PROFILE_INVITATION_LOCAL_TEST);assert.equal(data.host,"127.0.0.1");ready=true;break;}}catch(error){if(error instanceof assert.AssertionError)throw error;}await new Promise(resolve=>setTimeout(resolve,1000));}assert.ok(ready,"Local server readiness timed out");
 console.log("✓ HTTP server database identity verified; invitation log mode active.");
 const route="/api/representative/commercial-utility-packs/resources/"+encodeURIComponent(resourceId)+"/profile/invite";
 const fields={recipientName:"HTTP Visitor",recipientEmail:prefix+"-visitor@example.invalid",recipientOrganization:"HTTP QA",purpose:"Local HTTP invitation acceptance",idempotencyKey:randomUUID()};
 assert.equal((await request(route,fields)).response.status,401);
 assert.equal((await request(route,fields,actorCookie,"https://example.invalid")).response.status,403);
 assert.equal((await request(route,{...fields,scope:"LOI_INTAKE_ACCESS"},actorCookie)).response.status,400);
 assert.equal(await client.institutionalAccessGrant.count(),0);
 const sent=await request(route,fields,actorCookie);assert.equal(sent.response.status,202,JSON.stringify(sent.data));assert.ok(sent.data.ok);assert.equal(sent.data.receipt.recipientDeliveryStatus,"LOGGED_ONLY");assert.equal(sent.data.receipt.adminDeliveryStatus,"LOGGED_ONLY");
 const introduction=await client.representativeProfileIntroduction.findUniqueOrThrow({where:{id:sent.data.introductionId}});
 const again=await request(route,fields,actorCookie);assert.equal(again.data.introductionId,introduction.id);
 assert.equal((await request(route,{...fields,purpose:"Changed"},actorCookie)).response.status,409);
 assert.equal(await client.institutionalAccessGrant.count(),1);assert.equal(await client.representativeProfileIntroduction.count(),1);
 assert.equal((await request(route+"?introductionId="+introduction.id,undefined,adminCookie)).response.status,404);
 console.log("✓ Actual invitation API enforces session, origin, fields, ownership and replay; both channels logged only.");
 const visitor=await client.user.findUniqueOrThrow({where:{id:introduction.recipientUserId}});
 const pin="637291";await client.pinLoginRequest.create({data:{email:visitor.email,pinHash:await bcrypt.hash(pin,12),expiresAt:new Date(Date.now()+600000)}});
 const login=await request("/api/auth/login/verify",{email:visitor.email,pin});assert.equal(login.response.status,200,JSON.stringify(login.data));assert.equal(login.data.audience,"INSTITUTIONAL_VISITOR");
 const cookies=login.response.headers.getSetCookie();const set=cookies.find(value=>value.startsWith("axpt_session="));assert.ok(set);assert.match(set,/HttpOnly/i);const visitorCookie=set.split(";")[0];
 const publication=await request("/french-ward/profile",undefined,visitorCookie);assert.equal(publication.response.status,200);assert.ok(publication.text.includes("Official institutional publication"));assert.ok(!publication.text.includes("data-fw-profile-request"));
 assert.equal((await request("/api/auth/login/verify",{email:visitor.email,pin})).response.status,401);
 assert.equal((await request(route,fields,visitorCookie)).response.status,403);
 const register=await request("/admin/representative-program/profile-introductions",undefined,adminCookie);assert.equal(register.response.status,200);assert.ok(register.text.includes(fields.recipientEmail));assert.ok(register.text.includes("LOGGED_ONLY"));
 const blocked=await request("/admin/representative-program/profile-introductions",undefined,visitorCookie);assert.equal(blocked.response.status,404);
 console.log("✓ Real PIN verification establishes recipient session, opens Profile and denies representative/Admin controls; Admin register renders introduction.");
 for(const change of [{expiresAt:new Date(0)},{expiresAt:new Date(Date.now()+3600000),revokedAt:new Date()}]){await client.institutionalAccessGrant.update({where:{id:introduction.grantId},data:change});const denied=await request("/french-ward/profile",undefined,visitorCookie);assert.equal(denied.response.status,200);assert.match(denied.text,/data-fw-profile-request/);}
 assert.equal(await client.emailLog.count({where:{type:{startsWith:"ARP_PROFILE_INVITATION_"},status:"LOGGED_ONLY"}}),2);
 console.log("✓ Expiry and revocation block Profile rendering through an existing session.");
 console.log("ARP_PROFILE_INVITATION_HTTP_OK");
}
main().catch(error=>{console.error(redact(error.message));if(output)console.error(output);process.exitCode=1;}).finally(async()=>{await stop();await client.$disconnect();if(temporary)fs.rmSync(temporary,{recursive:true,force:true});});
