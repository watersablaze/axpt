/* AXPT-NEXT-1E.3 · DISPOSABLE PostgreSQL ONLY.
 * Launch: FW_TXN_1E_ACCEPT_DB=axpt_fw_txn_1e_test node --require tsx/cjs scripts/transactions/smokeIntakePromotionAuthority1E.cjs
 * Requires freshly initialized local database on 127.0.0.1:5433.
 */
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const Module = require("node:module");
const { PrismaClient } = require("@prisma/client");

const DB = "axpt_fw_txn_1e_test";
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const url = new URL(process.env[name] || "invalid://missing");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "5433");
  assert.equal(url.pathname, "/" + DB);
}
assert.equal(process.env.FW_TXN_1E_ACCEPT_DB, DB);
const client = new PrismaClient();
const nonce = randomUUID().replaceAll("-", "");
const userId = "axpt-1e-" + nonce;
const email = userId + "@example.test";
let principal = null;
const intakeIds = [];
let triggerInstalled = false;

const target = require.resolve("../../src/domains/control-center/transaction-intakes/promoteTransactionIntakeToOpportunity.ts");
const originalLoad = Module._load;
let promote;
try {
  Module._load = function(request, parent, isMain) {
    if (parent?.filename === target && request === "@/domains/auth/getPrincipal")
      return { getPrincipal: async () => principal };
    if (parent?.filename === target && request === "@/lib/prisma")
      return { prisma: client };
    return originalLoad.apply(this, arguments);
  };
  promote = require(target).promoteTransactionIntakeToOpportunity;
} finally {
  Module._load = originalLoad;
}
assert.equal(typeof promote, "function");

async function makeIntake(tag) {
  const intake = await client.transactionIntake.create({ data: {
    reference: "AXPT-1E-" + tag + "-" + randomUUID(),
    status: "QUALIFIED",
    submitterName: "Synthetic", submitterEmail: "synthetic@example.test",
    submitterRole: "SYNTHETIC", commodity: "TEST GOLD",
  } });
  intakeIds.push(intake.id);
  return intake;
}
async function denied(promise, error) {
  await assert.rejects(promise, e => e?.message === error);
}
async function unchanged(id) {
  const intake = await client.transactionIntake.findUniqueOrThrow({where:{id}});
  assert.equal(intake.promotedOpportunityId, null);
  assert.equal(intake.status, "QUALIFIED");
  assert.equal(await client.transactionIntakeEvent.count({
    where: {intakeId:id, eventType:"PROMOTED_TO_OPPORTUNITY"}
  }), 0);
}

async function run() {
  const [{db}] = await client.$queryRawUnsafe("SELECT current_database() AS db");
  assert.equal(db, DB);
  assert.equal(await client.frenchWardGoverningOfficer.count(), 0);
  console.log("PASS disposable database identity");

  const intake = await makeIntake("DENIAL");
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_UNAUTHENTICATED");
  await client.user.create({data:{
    id:userId,username:userId,email,passwordHash:"SYNTHETIC-NONLOGIN",
    viewedDocs:[],isAdmin:true
  }});
  const authorized = {userId,email,roles:["ADMIN_PLATFORM"],permissions:["ADMIN_SURFACE_ACCESS"]};
  principal = {...authorized, roles:[]};
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_ADMIN_AUTHORITY_REQUIRED");
  principal = {...authorized, permissions:[]};
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_ADMIN_AUTHORITY_REQUIRED");
  principal = authorized;
  await client.user.update({where:{id:userId},data:{isAdmin:false}});
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_ADMIN_AUTHORITY_REQUIRED");
  await client.user.update({where:{id:userId},data:{isAdmin:true}});
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_GOVERNING_AUTHORITY_REQUIRED");
  await unchanged(intake.id);
  console.log("PASS authentication and admin permission denials");

  await client.frenchWardGoverningOfficer.create({data:{
    userId,reference:"FW-GOV-002",displayName:"Synthetic",
    institutionalTitle:"Test",governingBasis:"DISPOSABLE_TEST",status:"INACTIVE"
  }});
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_GOVERNING_AUTHORITY_REQUIRED");
  await client.frenchWardGoverningOfficer.update({where:{userId},data:{status:"ACTIVE"}});
  console.log("PASS inactive governing standing rejected");

  const external = await makeIntake("EXTERNAL");
  await client.transactionIntakeEvent.create({data:{
    intakeId:external.id,eventType:"EXTERNAL_INTAKE_REGISTERED",actor:email,note:"SYNTHETIC"
  }});
  await denied(promote({intakeId:external.id}), "FW_TXN_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED");
  await unchanged(external.id);
  console.log("PASS external-intake exclusion");

  const first = await promote({intakeId:intake.id});
  assert.equal(first.alreadyPromoted,false);
  const replay = await promote({intakeId:intake.id});
  assert.equal(replay.alreadyPromoted,true);
  assert.equal(first.opportunityId,replay.opportunityId);
  await client.frenchWardGoverningOfficer.update({where:{userId},data:{status:"INACTIVE"}});
  await denied(promote({intakeId:intake.id}), "FW_TXN_PROMOTION_GOVERNING_AUTHORITY_REQUIRED");
  await client.frenchWardGoverningOfficer.update({where:{userId},data:{status:"ACTIVE"}});
  console.log("PASS sequential replay identity and revoked authority");

  const concurrent = await makeIntake("CONCURRENT");
  const results = await Promise.all([
    promote({intakeId:concurrent.id}),promote({intakeId:concurrent.id})
  ]);
  assert.equal(results[0].opportunityId,results[1].opportunityId);
  assert.deepEqual(results.map(x=>x.alreadyPromoted).sort(),[false,true]);
  assert.equal(await client.transactionIntakeEvent.count({where:{
    intakeId:concurrent.id,eventType:"PROMOTED_TO_OPPORTUNITY"
  }}),1);
  assert.equal(await client.opportunityEvent.count({where:{
    opportunityId:results[0].opportunityId,type:"OPPORTUNITY_CREATED"
  }}),1);
  console.log("PASS simultaneous promotion, single opportunity and event pair");

  const rollback = await makeIntake("ROLLBACK");
  await client.$executeRawUnsafe(
    "CREATE FUNCTION axpt_1e_fail_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN " +
    "IF NEW.\"metadata\"->>'intakeReference' LIKE 'AXPT-1E-ROLLBACK-%' THEN " +
    "RAISE EXCEPTION 'AXPT_1E_SYNTHETIC_FAILURE'; END IF; RETURN NEW; END; $$"
  );
  await client.$executeRawUnsafe(
    "CREATE TRIGGER axpt_1e_fail_event_trigger BEFORE INSERT ON \"OpportunityEvent\" " +
    "FOR EACH ROW EXECUTE FUNCTION axpt_1e_fail_event()"
  );
  triggerInstalled = true;
  await assert.rejects(promote({intakeId:rollback.id}),/AXPT_1E_SYNTHETIC_FAILURE/);
  await unchanged(rollback.id);
  assert.equal(await client.opportunity.count({where:{notes:{contains:rollback.reference}}}),0);
  console.log("PASS forced event failure rolls back claim and opportunity");
  console.log("AXPT_NEXT_1E_3_PROMOTION_PASS");
}

async function cleanup() {
  if(triggerInstalled) {
    await client.$executeRawUnsafe('DROP TRIGGER IF EXISTS axpt_1e_fail_event_trigger ON "OpportunityEvent"');
    await client.$executeRawUnsafe("DROP FUNCTION IF EXISTS axpt_1e_fail_event()");
  }
  for(const id of intakeIds) {
    const record=await client.transactionIntake.findUnique({where:{id}});
    if(!record) continue;
    await client.transactionIntakeEvent.deleteMany({where:{intakeId:id}});
    await client.transactionIntake.delete({where:{id}});
    if(record.promotedOpportunityId) {
      await client.opportunityEvent.deleteMany({where:{opportunityId:record.promotedOpportunityId}});
      await client.opportunity.delete({where:{id:record.promotedOpportunityId}});
    }
  }
  await client.frenchWardGoverningOfficer.deleteMany({where:{userId}});
  await client.user.deleteMany({where:{id:userId}});
}
run().catch(e=>{console.error("AXPT_NEXT_1E_3_FAIL",e);process.exitCode=1;})
.finally(async()=>{
 try {await cleanup();} catch(e){console.error("CLEANUP_FAILED",e);process.exitCode=1;}
 await client.$disconnect();
});
