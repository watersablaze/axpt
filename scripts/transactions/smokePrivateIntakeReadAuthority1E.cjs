/* AXPT-NEXT-1E.5C · disposable PostgreSQL read-authority regression.
 * Database must be the workflow's synthetic 127.0.0.1:5433 fixture only.
 */
const assert = require("node:assert/strict");
const {randomUUID} = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {PrismaClient} = require("@prisma/client");
const DB="axpt_fw_txn_1e_test";
for (const key of ["DATABASE_URL","DIRECT_URL"]) {
  const u=new URL(process.env[key]||"invalid://missing");
  assert.equal(u.hostname,"127.0.0.1");
  assert.equal(u.port,"5433");
  assert.equal(u.pathname,"/"+DB);
}
assert.equal(process.env.FW_TXN_1E_ACCEPT_DB,DB);
const prisma=new PrismaClient();
const nonce=randomUUID().replaceAll("-","");
const userId="axpt-1e-read-"+nonce;
let userCreated=false;
const target=path.resolve(__dirname,"../../src/domains/control-center/transaction-intakes/canReadTransactionIntakeWithClient.ts");
const read=require(target).canReadTransactionIntakeWithClient;
function inspectGuardOrder(file, firstRead) {
  const source=fs.readFileSync(path.resolve(__dirname,"../../",file),"utf8");
  const start=source.indexOf("export default async function ");
  assert.ok(start>=0,"MISSING_PAGE_ENTRY:"+file);
  const body=source.slice(start);
  const guard=body.indexOf("await canReadTransactionIntakeWithClient(");
  const first=body.indexOf(firstRead);
  assert.ok(guard>=0 && first>guard,"READ_BEFORE_AUTHORITY:"+file);
  assert.ok(body.slice(guard,first).includes("notFound()"),"MISSING_READ_DENIAL:"+file);
}
async function run() {
  const [{db}]=await prisma.$queryRawUnsafe("SELECT current_database() AS db");
  assert.equal(db,DB);
  inspectGuardOrder("app/admin/transaction-intakes/page.tsx","prisma.transactionIntake.findMany(");
  inspectGuardOrder("app/admin/transaction-intakes/[id]/page.tsx","prisma.transactionIntake.findUnique(");
  console.log("PASS registry/detail authority precedes private reads");
  const full={userId,roles:["ADMIN_PLATFORM"],permissions:["ADMIN_SURFACE_ACCESS"]};
  assert.equal(await read({client:prisma,principal:null}),false);
  assert.equal(await read({client:prisma,principal:{...full,roles:[]}}),false);
  assert.equal(await read({client:prisma,principal:{...full,permissions:[]}}),false);
  assert.equal(await read({client:prisma,principal:full}),false);
  await prisma.user.create({data:{
    id:userId,username:userId,email:userId+"@example.test",
    passwordHash:"SYNTHETIC-NONLOGIN",viewedDocs:[],isAdmin:false
  }});
  userCreated=true;
  assert.equal(await read({client:prisma,principal:full}),false);
  await prisma.user.update({where:{id:userId},data:{isAdmin:true}});
  assert.equal(await read({client:prisma,principal:full}),true);
  await prisma.user.update({where:{id:userId},data:{isAdmin:false}});
  assert.equal(await read({client:prisma,principal:full}),false);
  console.log("PASS absent principal, role/permission denials, unknown and inactive admin");
  console.log("PASS persisted administrator enables read; revocation denies read");
  console.log("AXPT_NEXT_1E_5C_PRIVATE_READ_PASS");
}
run().catch(e=>{console.error("AXPT_NEXT_1E_5C_PRIVATE_READ_FAIL",e);process.exitCode=1})
.finally(async()=>{
  try {if(userCreated)await prisma.user.deleteMany({where:{id:userId}});}
  catch(e){console.error("READ_CLEANUP_FAIL",e);process.exitCode=1}
  await prisma.$disconnect();
});
