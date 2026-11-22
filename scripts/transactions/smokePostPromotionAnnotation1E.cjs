/* AXPT-NEXT-1E.5A · Disposable post-promotion annotation authority regression */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");
const { PrismaClient } = require("@prisma/client");

const DB = "axpt_fw_txn_1e_test";
for(const name of ["DATABASE_URL","DIRECT_URL"]) {
  const u = new URL(process.env[name] || "invalid://missing");
  assert.equal(u.hostname,"127.0.0.1");
  assert.equal(u.port,"5433");
  assert.equal(u.pathname,"/"+DB);
}
assert.equal(process.env.FW_TXN_1E_ACCEPT_DB,DB);
const prisma = new PrismaClient();
let principal=null, intakeId=null, opportunityId=null, unpromotedId=null;
const nonce=randomUUID().replaceAll("-","");
const userId="axpt-1e-annotation-"+nonce;
const email=userId+"@example.test";
const filename=path.resolve(__dirname,"../../app/admin/transaction-intakes/[id]/page.tsx");
const src=fs.readFileSync(filename,"utf8");
const start=src.indexOf("async function appendPostPromotionAnnotation(");
const end=src.indexOf("async function promoteIntakeToOpportunity(",start);
assert.ok(start>=0&&end>start,"ANNOTATION_SOURCE_BOUNDARY_MISSING");
const js=ts.transpileModule(src.slice(start,end)+"\nmodule.exports = appendPostPromotionAnnotation;\n",{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const target={exports:{}};
new Function("module","prisma","getPrincipal","PERMISSIONS","revalidatePath",js)(
  target,prisma,async()=>principal,
  {ADMIN_SURFACE_ACCESS:"ADMIN_SURFACE_ACCESS"},()=>{}
);
const append=target.exports;
function form(id,opportunity,note){
  const f=new FormData();
  f.set("id",id);f.set("expectedOpportunityId",opportunity);f.set("annotation",note);
  return f;
}
async function denied(promise,reason){
  await assert.rejects(promise,e=>e?.message===reason);
}
async function snapshot(){
  return prisma.transactionIntake.findUniqueOrThrow({where:{id:intakeId}});
}
async function run(){
  const [{db}]=await prisma.$queryRawUnsafe("SELECT current_database() AS db");
  assert.equal(db,DB);
  await prisma.user.create({data:{
    id:userId,username:userId,email,passwordHash:"SYNTHETIC-NONLOGIN",
    viewedDocs:[],isAdmin:true
  }});
  const opportunity=await prisma.opportunity.create({data:{
    title:"Synthetic annotation opportunity",
    status:"INTAKE",source:"INTERNAL"
  }});
  opportunityId=opportunity.id;
  const intake=await prisma.transactionIntake.create({data:{
    reference:"AXPT-1E-ANNOTATION-"+randomUUID(),
    status:"PROMOTED_TO_OPPORTUNITY",
    submitterName:"Synthetic",submitterEmail:"synthetic@example.test",
    submitterRole:"TEST",internalNotes:"Source review note",
    promotedOpportunityId:opportunityId,
    promotedAt:new Date(),promotedBy:email
  }});
  intakeId=intake.id;
  const rawForm=form(intakeId,opportunityId,"Administrative follow-up");
  await denied(append(rawForm),"TRANSACTION_INTAKE_UNAUTHENTICATED");
  const full={userId,email,roles:["ADMIN_PLATFORM"],permissions:["ADMIN_SURFACE_ACCESS"]};
  principal={...full,permissions:[]};
  await denied(append(rawForm),"TRANSACTION_INTAKE_ANNOTATION_FORBIDDEN");
  principal={...full,roles:[]};
  await denied(append(rawForm),"TRANSACTION_INTAKE_ANNOTATION_FORBIDDEN");
  principal=full;
  await prisma.user.update({where:{id:userId},data:{isAdmin:false}});
  await denied(append(rawForm),"TRANSACTION_INTAKE_ANNOTATION_FORBIDDEN");
  await prisma.user.update({where:{id:userId},data:{isAdmin:true}});
  console.log("PASS annotation auth, role, permission, persisted administrator denials");

  await denied(append(form(intakeId,opportunityId,"  ")),"TRANSACTION_INTAKE_ANNOTATION_INVALID_CONTENT");
  await denied(append(form(intakeId,opportunityId,"x".repeat(4001))),"TRANSACTION_INTAKE_ANNOTATION_INVALID_CONTENT");
  await denied(append(form(intakeId,"wrong-opportunity","valid")),"TRANSACTION_INTAKE_ANNOTATION_NOT_ELIGIBLE");
  const other=await prisma.transactionIntake.create({data:{
    reference:"AXPT-1E-UNPROMOTED-"+randomUUID(),status:"QUALIFIED",
    submitterName:"Synthetic",submitterEmail:"synthetic@example.test",
    submitterRole:"TEST"
  }});
  unpromotedId=other.id;
  await denied(append(form(unpromotedId,opportunityId,"valid")),"TRANSACTION_INTAKE_ANNOTATION_NOT_ELIGIBLE");
  assert.equal(await prisma.transactionIntakeEvent.count({where:{intakeId}}),0);
  console.log("PASS content, target identity and unpromoted-intake denials");

  const before=await snapshot();
  await append(form(intakeId,opportunityId,"  Administrative follow-up  "));
  await append(form(intakeId,opportunityId,"Second observation"));
  const after=await snapshot();
  assert.equal(after.status,before.status);
  assert.equal(after.promotedOpportunityId,before.promotedOpportunityId);
  assert.equal(after.promotedAt?.toISOString(),before.promotedAt?.toISOString());
  assert.equal(after.promotedBy,before.promotedBy);
  assert.equal(after.internalNotes,before.internalNotes);
  assert.equal(after.updatedAt.toISOString(),before.updatedAt.toISOString());
  const notes=await prisma.transactionIntakeEvent.findMany({
    where:{intakeId,eventType:"POST_PROMOTION_ANNOTATION"},orderBy:{createdAt:"asc"}
  });
  assert.equal(notes.length,2);
  assert.equal(notes[0].actor,email);
  assert.equal(notes[0].note,"Administrative follow-up");
  assert.equal(notes[1].note,"Second observation");
  assert.equal(await prisma.opportunity.count({where:{id:opportunityId}}),1);
  console.log("PASS append-only events without intake or opportunity state change");

  await prisma.transactionIntake.update({where:{id:intakeId},data:{status:"ARCHIVED"}});
  await denied(append(rawForm),"TRANSACTION_INTAKE_ANNOTATION_NOT_ELIGIBLE");
  assert.equal(await prisma.transactionIntakeEvent.count({
    where:{intakeId,eventType:"POST_PROMOTION_ANNOTATION"}
  }),2);
  console.log("PASS invalid lifecycle cannot receive annotation");
  console.log("AXPT_NEXT_1E_5A_ANNOTATION_PASS");
}
async function cleanup(){
  if(intakeId){
    await prisma.transactionIntakeEvent.deleteMany({where:{intakeId}});
    await prisma.transactionIntake.deleteMany({where:{id:intakeId}});
  }
  if(unpromotedId)await prisma.transactionIntake.deleteMany({where:{id:unpromotedId}});
  if(opportunityId)await prisma.opportunity.deleteMany({where:{id:opportunityId}});
  await prisma.user.deleteMany({where:{id:userId}});
}
run().catch(e=>{console.error("AXPT_NEXT_1E_5A_FAIL",e);process.exitCode=1;})
.finally(async()=>{try{await cleanup();}catch(e){console.error("ANNOTATION_CLEANUP_FAIL",e);process.exitCode=1;}await prisma.$disconnect();});
