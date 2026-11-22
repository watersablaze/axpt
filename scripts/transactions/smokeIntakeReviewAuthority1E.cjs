/* AXPT-NEXT-1E.3 · Review action regression on DISPOSABLE PostgreSQL.
 * Extracts the actual server-action function from the source file, compiles
 * that function in isolation, and supplies a synthetic authenticated principal.
 * Guard: loopback 127.0.0.1:5433 + exact freshly initialized test database.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { PrismaClient } = require("@prisma/client");
const { isTransactionIntakeReviewStatus, canTransitionTransactionIntakeReviewStatus } =
  require("../../src/domains/control-center/transaction-intakes/intakeStatuses.ts");

const DB = "axpt_fw_txn_1e_test";
for(const name of ["DATABASE_URL","DIRECT_URL"]) {
  const url = new URL(process.env[name] || "invalid://missing");
  assert.equal(url.hostname,"127.0.0.1");
  assert.equal(url.port,"5433");
  assert.equal(url.pathname,"/"+DB);
}
assert.equal(process.env.FW_TXN_1E_ACCEPT_DB,DB);
const prisma = new PrismaClient();
const nonce = randomUUID().replaceAll("-","");
const userId = "axpt-1e-review-"+nonce;
const email = userId+"@example.test";
let principal = null;
let intakeId = null;
let triggerInstalled = false;

// Source under review, not a copy of its implementation.
const filename = path.resolve(__dirname,"../../app/admin/transaction-intakes/[id]/page.tsx");
const src = fs.readFileSync(filename,"utf8");
const start = src.indexOf("async function updateIntakeReview(");
const end = src.indexOf("async function promoteIntakeToOpportunity(",start);
assert.ok(start>=0 && end>start,"REVIEW_ACTION_SOURCE_BOUNDARY_MISSING");
const actionSource = src.slice(start,end);
const compiled = ts.transpileModule(actionSource+"\nmodule.exports = updateIntakeReview;\n",{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const moduleSlot = {exports:{}};
new Function("module","prisma","getPrincipal","PERMISSIONS",
  "isTransactionIntakeReviewStatus","canTransitionTransactionIntakeReviewStatus",
  "revalidatePath",compiled)(
  moduleSlot, prisma, async()=>principal, {ADMIN_SURFACE_ACCESS:"ADMIN_SURFACE_ACCESS"},
  isTransactionIntakeReviewStatus,canTransitionTransactionIntakeReviewStatus,()=>{}
);
const update = moduleSlot.exports;
assert.equal(typeof update,"function");

function form(record,status,notes,version) {
  const f = new FormData();
  f.set("id",record.id);
  f.set("expectedUpdatedAt",version ?? record.updatedAt.toISOString());
  if(status!==undefined)f.set("status",status);
  if(notes!==undefined)f.set("internalNotes",notes);
  return f;
}
async function denied(promise,code) {
  await assert.rejects(promise,e=>e?.message===code);
}
async function record() {
  return prisma.transactionIntake.findUniqueOrThrow({where:{id:intakeId}});
}
async function events() {
  return prisma.transactionIntakeEvent.findMany({where:{intakeId}});
}
async function run(){
  const [{db}] = await prisma.$queryRawUnsafe("SELECT current_database() AS db");
  assert.equal(db,DB);
  const user=await prisma.user.create({data:{
    id:userId, username:userId,email,passwordHash:"SYNTHETIC-NONLOGIN",
    viewedDocs:[], isAdmin:true
  }});
  const intake=await prisma.transactionIntake.create({data:{
    reference:"AXPT-1E-REVIEW-"+randomUUID(),
    status:"SUBMITTED",submitterName:"Synthetic",
    submitterEmail:"synthetic@example.test",submitterRole:"TEST"
  }});
  intakeId=intake.id;

  await denied(update(form(intake,"UNDER_REVIEW","test")),
    "TRANSACTION_INTAKE_UNAUTHENTICATED");
  const full={userId:user.id,email,roles:["ADMIN_PLATFORM"],permissions:["ADMIN_SURFACE_ACCESS"]};
  principal={...full,roles:[]};
  await denied(update(form(intake,"UNDER_REVIEW","test")),
    "TRANSACTION_INTAKE_REVIEW_FORBIDDEN");
  principal={...full,permissions:[]};
  await denied(update(form(intake,"UNDER_REVIEW","test")),
    "TRANSACTION_INTAKE_REVIEW_FORBIDDEN");
  principal=full;
  await prisma.user.update({where:{id:userId},data:{isAdmin:false}});
  await denied(update(form(intake,"UNDER_REVIEW","test")),
    "TRANSACTION_INTAKE_REVIEW_FORBIDDEN");
  await prisma.user.update({where:{id:userId},data:{isAdmin:true}});
  assert.equal((await events()).length,0);
  console.log("PASS review authentication, role, permission, persisted admin denials");

  await update(form(await record(),"SUBMITTED","notes only"));
  assert.equal((await record()).status,"SUBMITTED");
  let audit=await events();
  assert.equal(audit.length,1);
  assert.equal(audit[0].eventType,"INTERNAL_NOTE_UPDATED");
  assert.equal(audit[0].actor,email);
  console.log("PASS notes-only mutation with attribution");

  const old=await record();
  await prisma.transactionIntake.update({where:{id:intakeId},
    data:{internalNotes:"newer review"}});
  await denied(update(form(old,"UNDER_REVIEW","stale edit")),
    "TRANSACTION_INTAKE_REVIEW_STALE");
  assert.equal((await record()).status,"SUBMITTED");
  assert.equal((await record()).internalNotes,"newer review");
  assert.equal((await events()).length,1);
  console.log("PASS stale version rejection without event");

  await denied(update(form(await record(),"QUALIFIED","newer review")),
    "TRANSACTION_INTAKE_REVIEW_TRANSITION_NOT_ALLOWED");
  assert.equal((await events()).length,1);
  await update(form(await record(),"UNDER_REVIEW","newer review"));
  assert.equal((await record()).status,"UNDER_REVIEW");
  audit=await events();
  assert.equal(audit.filter(e=>e.eventType==="STATUS_CHANGED").length,1);
  console.log("PASS transition matrix and status event");

  const current=await record();
  const both=await Promise.allSettled([
    update(form(current,"UNDER_REVIEW","operator A")),
    update(form(current,"UNDER_REVIEW","operator B"))
  ]);
  assert.equal(both.filter(x=>x.status==="fulfilled").length,1);
  const failure=both.find(x=>x.status==="rejected");
  assert.equal(failure?.reason?.message,"TRANSACTION_INTAKE_REVIEW_STALE");
  assert.equal((await events()).filter(e=>e.eventType==="INTERNAL_NOTE_UPDATED").length,2);
  console.log("PASS competing notes writes, one winner and one stale rejection");

  const before=await record();
  const eventsBefore=(await events()).length;
  await prisma.$executeRawUnsafe(
    "CREATE FUNCTION axpt_1e_fail_review_event() RETURNS trigger LANGUAGE plpgsql AS $$ "+
    "BEGIN IF NEW.\"intakeId\" = '"+intakeId+"' AND NEW.\"eventType\" = 'STATUS_CHANGED' "+
    "THEN RAISE EXCEPTION 'AXPT_1E_REVIEW_FAILURE'; END IF; RETURN NEW; END; $$"
  );
  await prisma.$executeRawUnsafe(
    'CREATE TRIGGER axpt_1e_fail_review_event_trigger BEFORE INSERT ON "TransactionIntakeEvent" '+
    'FOR EACH ROW EXECUTE FUNCTION axpt_1e_fail_review_event()'
  );
  triggerInstalled=true;
  await assert.rejects(update(form(before,"QUALIFIED",before.internalNotes)),
    /AXPT_1E_REVIEW_FAILURE/);
  assert.equal((await record()).status,before.status);
  assert.equal((await events()).length,eventsBefore);
  console.log("PASS forced audit event failure rolls back review transition");
  console.log("AXPT_NEXT_1E_3_REVIEW_PASS");
}
async function cleanup(){
  if(triggerInstalled){
    await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS axpt_1e_fail_review_event_trigger ON "TransactionIntakeEvent"');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS axpt_1e_fail_review_event()');
  }
  if(intakeId){
    await prisma.transactionIntakeEvent.deleteMany({where:{intakeId}});
    await prisma.transactionIntake.deleteMany({where:{id:intakeId}});
  }
  await prisma.user.deleteMany({where:{id:userId}});
}
run().catch(e=>{console.error("AXPT_NEXT_1E_3_REVIEW_FAIL",e);process.exitCode=1;})
.finally(async()=>{try{await cleanup();}catch(e){console.error("REVIEW_CLEANUP_FAIL",e);process.exitCode=1;}await prisma.$disconnect();});
