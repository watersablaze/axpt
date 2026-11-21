const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
function compile(file, imports) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText, { module, exports: module.exports, Error, Set, Date, console,
    URL, Request, Response, require: name => {
      if (name === 'node:crypto') return require(name);
      assert.ok(Object.hasOwn(imports, name), 'Unexpected runtime import: ' + name);
      return imports[name];
    },
  }, { filename: file });
  return module.exports;
}
const domainFile = 'src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts';
const events = { CONVERSATION_CREATED: 'CONVERSATION_CREATED', OPERATIONAL_ROOM_CREATED: 'ROOM_CREATED', OPERATIONAL_TARGET_LINKED: 'TARGET_LINKED', MESSAGE_SENT: 'MESSAGE_SENT' };
const domain = compile(domainFile, { '@/domains/communications/events': { COMMUNICATION_EVENT_TYPE: events } });
function fixture() {
  const state = { participant: { id: 'participant', docketReference: 'RP-TEST', displayName: 'Test representative', userId: 'rep', createdByUserId: 'operator' }, room: null, links: [], events: [], messages: [], admin: true, failAudit: false, uniqueOnce: false };
  const tx = {
    representativeProgramParticipant: {
      findUnique: async ({where}) => where.id === state.participant?.id ? state.participant : null,
      findMany: async ({where}) => where.userId === state.participant?.userId ? [state.participant] : [],
    },
    user: { findUnique: async () => ({ id: 'operator', isAdmin: state.admin }) },
    communicationOperationalRoom: { findUnique: async () => state.room },
    communicationConversation: { update: async () => ({}), create: async ({data}) => {
      if (state.uniqueOnce) { state.uniqueOnce = false; throw Object.assign(new Error('race'), {code:'P2002'}); }
      const room = { id: 'room', conversationId: 'conversation', ...data.operationalRoom.create };
      const conversation = { id: 'conversation', ...data, members: data.members.create, operationalRoom: room };
      state.room = { ...room, conversation };
      return conversation;
    } },
    communicationOperationalLink: {
      findUnique: async () => state.links[0] || null,
      create: async ({data}) => { const link = {id:'link', linkedAt:new Date(), ...data}; state.links.push(link); return link; },
    },
    domainEvent: { create: async ({data}) => { if (state.failAudit) throw new Error('AUDIT_FAILED'); state.events.push(data); return data; } },
    communicationMessage: {
      findUnique: async () => null,
      create: async ({data}) => { const m={id:'message',createdAt:new Date(),...data};state.messages.push(m);return m; },
    },
    emailLog: new Proxy({}, { get() { throw new Error('Email access forbidden in room-open test'); } }),
  };
  let serial = Promise.resolve();
  const client = { $transaction: action => {
    const run = serial.then(async () => {
      const snapshot = structuredClone({room:state.room,links:state.links,events:state.events,messages:state.messages});
      try { return await action(tx); } catch(e) {Object.assign(state,snapshot);throw e;}
    });
    serial = run.catch(()=>{}); return run;
  } };
  return {state, client};
}
const input = f => ({client:f.client,participantId:'participant',operatorUserId:'operator'});
async function main() {
  let f=fixture();
  const results=await Promise.all(Array.from({length:4},()=>domain.openAdminRepresentativeFieldRoomWithClient(input(f))));
  assert.ok(results.every(x=>x.conversationId==='conversation'));
  assert.equal(f.state.events.length,3);assert.equal(f.state.links.length,1);assert.equal(f.state.messages.length,0);
  assert.equal(Array.from(f.state.room.conversation.members,x=>x.userId).sort().join(','),'operator,rep');
  assert.ok(f.state.events.every(e=>e.metadata.actorUserId==='operator'));
  console.log('PASS concurrent/repeated opens reuse one room; operator attribution; no message/email');
  for (const mutate of [f=>f.state.participant.createdByUserId='other',f=>f.state.participant.userId=null,f=>f.state.admin=false]) {
    f=fixture();mutate(f);await assert.rejects(domain.openAdminRepresentativeFieldRoomWithClient(input(f)));assert.equal(f.state.room,null);
  }
  f=fixture();await assert.rejects(domain.openAdminRepresentativeFieldRoomWithClient({...input(f),participantId:'missing'}));
  console.log('PASS wrong operator, unbound/missing participant and non-admin operator denied');
  for (const mutate of [f=>f.state.room.conversation.status='ARCHIVED',f=>f.state.room.conversation.members=[],f=>f.state.room.roomClass='OTHER']) {
    f=fixture();await domain.openAdminRepresentativeFieldRoomWithClient(input(f));mutate(f);await assert.rejects(domain.openAdminRepresentativeFieldRoomWithClient(input(f)));assert.equal(f.state.events.length,3);
  }
  f=fixture();f.state.failAudit=true;await assert.rejects(domain.openAdminRepresentativeFieldRoomWithClient(input(f)));assert.equal(f.state.room,null);assert.equal(f.state.events.length,0);
  f=fixture();f.state.uniqueOnce=true;await domain.openAdminRepresentativeFieldRoomWithClient(input(f));assert.equal(f.state.events.length,3);
  console.log('PASS archived/topology/membership conflicts deny; audit rollback; unique-race retry');
  f=fixture();await domain.openAdminRepresentativeFieldRoomWithClient(input(f));let notified=0;
  await domain.sendRepresentativeFieldMessageWithClient({client:f.client,userId:'rep',clientMessageId:'test-id',type:'COMMENT',body:'Isolated test',onMessageCreated:async()=>{notified++}});
  assert.equal(f.state.messages.length,1);assert.equal(notified,1);assert.equal(f.state.events.length,4);
  console.log('PASS existing representative send reuses room and retains message-created callback');
  let principal={userId:'operator',permissions:['COMMUNICATIONS_ACCESS','COMMUNICATIONS_CONVERSATION_MANAGE']};let calls=0;
  const route=compile('app/api/admin/representative-program/participants/[participantId]/field-conversation/route.ts', {
    'next/server':{NextResponse:{json:(data,options)=>Response.json(data,options)}},
    '@/domains/auth/getPrincipal':{getPrincipal:async()=>principal},
    '@/domains/auth/isAdmin':{isAdmin:p=>p.admin!==false},
    '@/domains/auth/permissions':{PERMISSIONS:{COMMUNICATIONS_ACCESS:'COMMUNICATIONS_ACCESS',COMMUNICATIONS_CONVERSATION_MANAGE:'COMMUNICATIONS_CONVERSATION_MANAGE'}},
    '@/infrastructure/db/prisma':{prisma:{}},
    '@/domains/instruments/representative-program/communications/representativeFieldCommunications':{openAdminRepresentativeFieldRoomWithClient:async p=>{calls++;assert.equal(p.operatorUserId,'operator');return {conversationId:'conversation'};}},
  });
  const request=(body='{}',origin='https://test.invalid')=>new Request('https://test.invalid/api/open',{method:'POST',headers:{origin,'content-type':'application/json'},body});
  const context={params:Promise.resolve({participantId:'participant'})};
  assert.equal((await route.POST(request('{}','https://wrong.invalid'),context)).status,403);
  principal=null;assert.equal((await route.POST(request(),context)).status,401);
  principal={userId:'operator',permissions:[],admin:true};assert.equal((await route.POST(request(),context)).status,403);
  principal={userId:'operator',permissions:['COMMUNICATIONS_ACCESS','COMMUNICATIONS_CONVERSATION_MANAGE'],admin:false};assert.equal((await route.POST(request(),context)).status,403);
  principal.admin=true;assert.equal((await route.POST(request('{"operatorUserId":"other"}'),context)).status,400);
  assert.equal(calls,0);assert.equal((await route.POST(request(),context)).status,200);assert.equal(calls,1);
  console.log('PASS actual POST handler enforces origin, session, permissions and strict fields; actor comes from principal');
  console.log('ADMIN_FIELD_ROOM_OPEN_SMOKE_OK — simulated transactions/HTTP only; no database or email connection');
}
main().catch(e=>{console.error(e);process.exitCode=1});
