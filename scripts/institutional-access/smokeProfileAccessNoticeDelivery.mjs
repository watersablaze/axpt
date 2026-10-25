import assert from "node:assert/strict";
import {registerHooks} from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); }
    catch (error) {
      if (specifier.startsWith(".") &&
          !/\.[a-z]+$/i.test(specifier))
        return next(specifier + ".ts", context);
      throw error;
    }
  },
});

const {sendProfileAccessNoticeWithClient: dispatch,
       renderProfileAccessNotice,
       PROFILE_ACCESS_URL} =
  await import("../../src/domains/institutional-access/sendProfileAccessNoticeWithClient.ts");

const {projectFrenchWardInstitutionalProfile} =
  await import("../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile.ts");

const profile = projectFrenchWardInstitutionalProfile();
const now = new Date("2026-10-25T12:00:00Z");
const key = label => `FW-PROFILE-TEST-${label}-20261025`;

function fixture(options = {}) {
  const email = "recipient@example.invalid";
  const recipient = {id:"recipient-1", email};
  const grant = {
    id:"grant-1",
    requestId:"request-1",
    recipientUserId:recipient.id,
    recipientEmail:email,
    scope:"PROFILE_VIEW",
    resourceReference:profile.reference,
    resourceVersion:profile.version,
    issuedAt:new Date(now.getTime()-3600000),
    expiresAt:new Date(now.getTime()+3600000),
    revokedAt:null,
    recipient,
    ...options.grant
  };
  const request = {
    id:"request-1",
    status:"APPROVED",
    scope:"PROFILE_VIEW",
    requesterEmail:email,
    resourceReference:profile.reference,
    resourceVersion:profile.version,
    grant,
    ...options.request
  };

  const records = new Map();
  const emailLogs = [], events = [], sent = [];

  const client = {
    institutionalAccessRequest:{
      findUnique:async()=>request
    },
    profileAccessNoticeDelivery:{
      create:async({data})=>{
        if(records.has(data.deliveryKey))
          throw new Error("DUPLICATE_KEY");
        const record = {id:`notice-${records.size+1}`, ...data,
          messageId:null,error:null};
        records.set(data.deliveryKey,record);
        return record;
      },
      findUnique:async({where})=>records.get(where.deliveryKey)||null,
      update:async({where,data})=>{
        const record = [...records.values()].find(x=>x.id===where.id);
        assert.ok(record);
        Object.assign(record,data);
        return record;
      },
    },
    emailLog:{create:async({data})=>{emailLogs.push(data);return data;}},
    domainEvent:{create:async({data})=>{events.push(data);return data;}},
    $transaction:async(run)=>run(client)
  };

  const send = async mail => {
    sent.push(mail);
    if(options.provider==="reject")return {error:{message:"synthetic rejection"}};
    if(options.provider==="throw")throw new Error("synthetic timeout");
    return {data:{id:`provider-${sent.length}`}};
  };

  const call = (deliveryKey=key("INITIAL"))=>dispatch({
    client, actorUserId:"operator-1",
    requestId:request.id, deliveryKey,
    from:"French-Ward <test@example.invalid>",
    send, now
  });

  return {call,request,grant,records,emailLogs,events,sent};
}

const notice=renderProfileAccessNotice();
assert.match(notice.text,/has been approved/);
assert.ok(notice.text.includes(PROFILE_ACCESS_URL));
assert.match(notice.text,/No further access request is required/);
console.log("✓ Notice includes approved recipient sign-in instructions");

{
  const f=fixture();
  const result=await f.call();
  assert.equal(result.status,"ACCEPTED");
  assert.equal(result.alreadyAttempted,false);
  assert.equal(f.sent.length,1);
  assert.equal(f.sent[0].to,"recipient@example.invalid");
  assert.equal(f.sent[0].idempotencyKey,key("INITIAL"));
  assert.equal(f.emailLogs.length,1);
  assert.equal(f.events.length,1);
  assert.equal(f.records.size,1);
  assert.equal(f.grant.recipientUserId,"recipient-1");

  const replay=await f.call();
  assert.equal(replay.alreadyAttempted,true);
  assert.equal(f.sent.length,1);
  assert.equal(f.events.length,1);

  const resend=await f.call(key("RESEND"));
  assert.equal(resend.status,"ACCEPTED");
  assert.equal(f.sent.length,2);
  assert.equal(f.events.length,2);
  console.log("✓ Acceptance, audit, idempotent replay, and explicit resend");
}

for (const [name,options] of [
  ["pending",{request:{status:"PENDING"}}],
  ["revoked",{grant:{revokedAt:new Date(now)}}],
  ["expired",{grant:{expiresAt:new Date(now.getTime()-1000)}}],
  ["wrong scope",{grant:{scope:"LOI_INTAKE_ACCESS"}}],
  ["wrong edition",{request:{resourceVersion:profile.version+1}}],
  ["mismatched recipient",{grant:{recipientEmail:"other@example.invalid"}}]
]) {
  const f=fixture(options);
  await assert.rejects(f.call(),/PROFILE_NOTICE_GRANT_UNAVAILABLE/);
  assert.equal(f.sent.length,0);
  assert.equal(f.records.size,0);
}
console.log("✓ Pending, revoked, expired, mismatched scope/edition/identity denied");

{
  const f=fixture({provider:"reject"});
  const result=await f.call();
  assert.equal(result.status,"FAILED");
  assert.equal(f.emailLogs[0].status,"FAILED");
  assert.equal((await f.call()).alreadyAttempted,true);
  assert.equal(f.sent.length,1);
}
{
  const f=fixture({provider:"throw"});
  const result=await f.call();
  assert.equal(result.status,"DELIVERY_UNKNOWN");
  assert.equal(f.emailLogs[0].status,"DELIVERY_UNKNOWN");
  assert.equal((await f.call()).alreadyAttempted,true);
  assert.equal(f.sent.length,1);
}
console.log("✓ Rejected and uncertain provider outcomes recorded without retry");

console.log("PROFILE_NOTICE_DELIVERY_SMOKE_OK");
console.log("No database mutation or real email delivery");
