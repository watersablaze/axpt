import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import {randomUUID, randomBytes} from "node:crypto";
import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {SignJWT} from "jose";
import {PrismaClient} from "@prisma/client";
const require = createRequire(import.meta.url), root = process.cwd();
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_cup_additions_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_CUP_ADDITIONS_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({datasources: {db: {url: url.href}}});
const prefix = "additions-http-" + randomUUID(), packageId = prefix + "-pack", participantId = prefix + "-participant";
const port = 3098, base = "http://localhost:" + port, secret = randomBytes(48).toString("hex");
const env = {...process.env, SIGNING_SECRET: secret, LOG_SECRET: randomBytes(48).toString("hex"), NODE_ENV: "development",
  RESEND_API_KEY: "re_local_inert_acceptance_key", BLOB_READ_WRITE_TOKEN: "",
  REPRESENTATIVE_BUYER_DOSSIER_EMAIL_MODE: "log", REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE: "log",
  REPRESENTATIVE_ONBOARDING_EMAIL_MODE: "log"};
let temporary, server, output = "";
function redact(value){let text=String(value||"");for(const key of [url.href,url.password,decodeURIComponent(url.password),secret,env.LOG_SECRET])if(key)text=text.split(key).join("[REDACTED]");return text.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi,"[REDACTED_CONNECTION]");}
function write(name,value){const target=path.join(temporary,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
function expose(name,exports){let source=path.relative(path.dirname(path.join(temporary,name)),path.join(root,name)).split(path.sep).join("/").replace(/\.tsx?$/,"");if(!source.startsWith("."))source="./"+source;write(name,`export { ${exports} } from ${JSON.stringify(source)};\n`+(exports==="default"?'export const dynamic="force-dynamic";\n':""));}
async function cookie(user){const tokenId=randomUUID();await client.session.create({data:{userId:user.id,tokenId,status:"active",expiresAt:new Date(Date.now()+3600000)}});const token=await new SignJWT({userId:user.id,email:user.email,tokenId,tier:"operations",roles:[],displayName:"Local fixture",popupMessage:"Local acceptance",greeting:"Welcome",partner:"AXPT",docs:[]}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(secret));return "axpt_session="+token;}
async function request(route,body,session,origin=base){const response=await fetch(base+route,{method:body===undefined?"GET":"POST",headers:{...(session?{Cookie:session}:{}),...(body===undefined?{}:{"Content-Type":"application/json",Origin:origin})},body:body===undefined?undefined:JSON.stringify(body),redirect:"manual",signal:AbortSignal.timeout(90000)});const text=await response.text();return {response,text,data:response.headers.get("content-type")?.includes("application/json")?JSON.parse(text):null};}
async function stop(){if(!server||server.exitCode!==null||server.signalCode!==null)return;const done=new Promise(resolve=>server.once("exit",resolve));server.kill("SIGTERM");await Promise.race([done,new Promise(resolve=>setTimeout(resolve,5000))]);if(server.exitCode===null&&server.signalCode===null){server.kill("SIGKILL");await done;}}
async function main() {
  const identity = await client.$queryRaw`SELECT current_database() AS database`;
  assert.equal(identity[0].database, process.env.ARP_CUP_ADDITIONS_LOCAL_TEST);
  assert.equal(await client.user.count(), 0, "STOP: disposable database is not empty");
  const user = async (suffix, isAdmin = false) => client.user.create({data: {username: prefix + suffix,
    email: prefix + suffix + "@example.invalid", passwordHash: "NOT_A_LOGIN_PASSWORD",
    displayName: "Local acceptance", viewedDocs: [], isAdmin}});
  const admin = await user("-admin", true), representative = await user("-representative");
  const role = await client.role.create({data: {key: "ADMIN_PLATFORM", label: "Local Administrator"}});
  await client.userRole.create({data: {userId: admin.id, roleId: role.id}});
  await client.representativeProgramParticipant.create({data: {id: participantId, userId: representative.id,
    docketReference: prefix, displayName: "Local Representative", standing: "ACTIVE", createdByUserId: admin.id}});
  await client.commercialUtilityPack.create({data: {id: packageId, participantId, reference: prefix + "-CUP",
    state: "PREPARING", releaseState: "PARTIAL", createdByUserId: admin.id,
    modules: {create: {module: "DOCUMENTS", state: "RELEASED", releasedAt: new Date(1000), releasedByUserId: admin.id}}}});
  const selected = [0, 1, 2].map(index => prefix + "-addition-" + index), heldId = prefix + "-unselected", existingId = prefix + "-existing";
  for (const id of [...selected, heldId]) await client.commercialUtilityPackResourceRelease.create({data: {
    id, packageId, module: "DOCUMENTS", resourceType: "DOCUMENT", resourceId: id, label: "Local PDF " + id,
    state: "WITHHELD", canView: false, canDownload: false, canPresent: false, canTransmit: false,
    metadata: {publicationVersion: 1, sha256: "a".repeat(64), fileUrl: "PRIVATE_STORAGE_LOCATOR_SENTINEL"}}});
  await client.commercialUtilityPackResourceRelease.create({data: {id: existingId, packageId, module: "DOCUMENTS",
    resourceType: "DOCUMENT", resourceId: existingId, state: "RELEASED", canView: true, canDownload: false,
    canPresent: true, canTransmit: true, releasedAt: new Date(1000), releasedByUserId: admin.id}});
  const baselinePack = await client.commercialUtilityPack.findUniqueOrThrow({where: {id: packageId}, include: {modules: true}});
  const baselineExisting = await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: existingId}});
  const baselineHeld = await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: heldId}});
  const rows = () => client.commercialUtilityPackResourceRelease.findMany({where: {id: {in: selected}}, orderBy: {id: "asc"}});
  const baselineRows = await rows();
  const adminCookie = await cookie(admin), representativeCookie = await cookie(representative);
  await new Promise((resolve, reject) => {const probe = net.createServer(); probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));});
  temporary = fs.mkdtempSync(path.join(root, ".arp-additions-http-"));
  for (const name of ["node_modules", "src"]) fs.symlinkSync(path.join(root, name), path.join(temporary, name), "dir");
  write("package.json", JSON.stringify({private: true}));
  write("tsconfig.json", JSON.stringify({compilerOptions: {target: "ES2022", module: "ESNext", moduleResolution: "bundler",
    jsx: "react-jsx", esModuleInterop: true, baseUrl: ".", paths: {"@/*": ["src/*"]}}}));
  write("next.config.mjs", "export default {experimental:{externalDir:true}};\n");
  write("app/layout.tsx", "export default function Layout({children}) {return <html><body>{children}</body></html>;}\n");
  expose("app/api/admin/representative-program/commercial-utility-packs/release-additions/route.ts", "GET, POST");
  write("app/api/acceptance-health/route.ts", 'import {prisma} from "@/infrastructure/db/prisma"; export async function GET(){const rows=await prisma.$queryRaw`SELECT current_database() AS database`;return Response.json({database:rows[0].database,host:new URL(process.env.DATABASE_URL).hostname});}');
  server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", temporary, "--webpack", "--hostname", "127.0.0.1", "--port", String(port)],
    {cwd: temporary, env, stdio: ["ignore", "pipe", "pipe"]});
  const capture = chunk => {output = (output + redact(chunk)).slice(-18000);};
  server.stdout.on("data", capture); server.stderr.on("data", capture); server.on("error", capture);
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null || server.signalCode !== null) throw new Error("Local server exited");
    try {const response = await fetch(base + "/api/acceptance-health", {signal: AbortSignal.timeout(3000)});
      if (response.ok) {const data = await response.json(); assert.equal(data.database, process.env.ARP_CUP_ADDITIONS_LOCAL_TEST);
        assert.equal(data.host, "127.0.0.1"); ready = true; break;}
    } catch (error) {if (error instanceof assert.AssertionError) throw error;}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, "Local server readiness timed out");
  console.log("✓ HTTP server database identity verified against the disposable local database.");
  const route = "/api/admin/representative-program/commercial-utility-packs/release-additions";
  const query = ids => "?" + new URLSearchParams([["packageId", packageId], ...ids.map(id => ["resourceReleaseId", id])]);
  const status = async (expected, route, body, session, origin) => {
    const result = await request(route, body, session, origin);
    assert.equal(result.response.status, expected, result.text.slice(0, 1000)); return result;
  };
  await status(401, route + query(selected));
  await status(403, route + query(selected), undefined, representativeCookie);
  await status(400, route + query([selected[0], selected[0]]), undefined, adminCookie);
  await status(400, route + query(selected) + "&extra=true", undefined, adminCookie);
  await status(409, route + query(["missing"]), undefined, adminCookie);
  await status(409, route + query([existingId]), undefined, adminCookie);
  const review = await status(200, route + query(selected), undefined, adminCookie);
  assert.equal(review.data.review.participantId, participantId);
  assert.deepEqual(review.data.review.resources.map(resource => resource.id).sort(), [...selected].sort());
  assert.ok(!review.text.includes("PRIVATE_STORAGE_LOCATOR_SENTINEL"));
  assert.ok(!review.text.includes('"metadata"'));
  const reversed = await status(200, route + query([...selected].reverse()), undefined, adminCookie);
  assert.equal(reversed.data.review.reviewHash, review.data.review.reviewHash);
  assert.deepEqual(await rows(), baselineRows); assert.equal(await client.domainEvent.count(), 0);
  const fields = {packageId, resourceReleaseIds: selected, reviewHash: review.data.review.reviewHash,
    reason: "Reviewed additions for local HTTP acceptance", confirmRelease: true};
  await status(401, route, fields);
  await status(403, route, fields, representativeCookie);
  await status(403, route, fields, adminCookie, "https://example.invalid");
  await status(400, route, {...fields, canTransmit: true}, adminCookie);
  await status(400, route, {...fields, confirmRelease: false}, adminCookie);
  await status(400, route, {...fields, reason: " "}, adminCookie);
  await status(400, route, {...fields, resourceReleaseIds: [selected[0], selected[0]]}, adminCookie);
  await status(413, route, {...fields, reason: "x".repeat(13000)}, adminCookie);
  await status(409, route, {...fields, reviewHash: "0".repeat(64)}, adminCookie);
  assert.deepEqual(await rows(), baselineRows); assert.equal(await client.domainEvent.count(), 0);
  await client.commercialUtilityPackResourceRelease.update({where: {id: selected[0]}, data: {metadata: {publicationVersion: 2}}});
  await status(409, route, fields, adminCookie);
  assert.ok((await rows()).every(resource => resource.state === "WITHHELD"));
  await client.commercialUtilityPackResourceRelease.update({where: {id: selected[0]}, data: {metadata: baselineRows.find(resource => resource.id === selected[0]).metadata}});
  const fresh = await status(200, route + query(selected), undefined, adminCookie);
  fields.reviewHash = fresh.data.review.reviewHash;
  console.log("✓ Real sessions enforce Admin access, same origin, strict fields, confirmation, selection and stale-review rejection; GET performs no release.");
  const attempts = await Promise.all([request(route, fields, adminCookie), request(route, fields, adminCookie)]);
  assert.deepEqual(attempts.map(result => result.response.status).sort(), [200, 409]);
  const after = await rows();
  assert.ok(after.every(resource => resource.state === "RELEASED" && resource.releasedByUserId === admin.id && resource.releasedAt));
  assert.ok(after.every(resource => !resource.canView && !resource.canDownload && !resource.canPresent && !resource.canTransmit));
  assert.deepEqual(after.map(resource => resource.metadata), baselineRows.map(resource => resource.metadata));
  assert.equal(await client.domainEvent.count(), 4);
  await status(409, route, fields, adminCookie); assert.equal(await client.domainEvent.count(), 4);
  assert.deepEqual(await client.commercialUtilityPack.findUniqueOrThrow({where: {id: packageId}, include: {modules: true}}), baselinePack);
  assert.deepEqual(await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: existingId}}), baselineExisting);
  assert.deepEqual(await client.commercialUtilityPackResourceRelease.findUniqueOrThrow({where: {id: heldId}}), baselineHeld);
  assert.equal(await client.institutionalAccessGrant.count(), 0); assert.equal(await client.emailLog.count(), 0);
  console.log("✓ Actual POST releases exactly the selected additions once, preserves permissions, metadata, unselected resources and parent history, and creates no grants or mail.");
  console.log("ARP_SELECTED_CUP_ADDITIONS_HTTP_OK");
}
main().catch(error => {console.error(redact(error.stack || error.message)); if (output) console.error(output); process.exitCode = 1;})
  .finally(async () => {await stop(); await client.$disconnect(); if (temporary) fs.rmSync(temporary, {recursive: true, force: true});});
