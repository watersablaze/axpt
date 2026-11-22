import assert from 'node:assert/strict';
import { deliverRepresentativeBuyerDossierWithClient } from '../../src/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeBuyerDossierWithClient.ts';
function fixture(){
 const row={id:'dossier',actorUserId:'representative',recipientUserId:'buyer',recipientName:'Buyer',recipientEmail:'buyer@example.invalid',recipientOrganization:'Buyer Group',purpose:'PRIVATE_INTERNAL_PURPOSE',expiresAt:new Date(Date.now()+3600000),recipientDeliveryStatus:'QUEUED',adminDeliveryStatus:'QUEUED',adminRecipients:['admin@example.invalid'],participant:{displayName:'Representative'},actor:{email:'representative@example.invalid'},items:[{label:'Profile',resourceReference:'PROFILE',resourceVersion:2},{label:'Source Authority',resourceReference:'BAF-SAI',resourceVersion:1}]};
 const logs=[],events=[];let tail=Promise.resolve();
 const tx={$queryRaw:async()=>[],representativeBuyerDossier:{findFirst:async({where})=>where.id===row.id&&where.actorUserId===row.actorUserId?row:null,update:async({data})=>{Object.assign(row,data);return row},updateMany:async({where,data})=>{if(where.recipientDeliveryStatus&&where.recipientDeliveryStatus!==row.recipientDeliveryStatus)return{count:0};if(where.adminDeliveryStatus&&where.adminDeliveryStatus!==row.adminDeliveryStatus)return{count:0};Object.assign(row,data);return{count:1}}},emailLog:{create:async value=>logs.push(value)},domainEvent:{create:async value=>events.push(value)}};
 const client={$transaction:async(run)=>{const previous=tail;let release;tail=new Promise(resolve=>release=resolve);await previous;try{return await run(tx)}finally{release()}}};
 return{row,client,logs,events};
}
const options={dossierId:'dossier',actorUserId:'representative',mode:'send',from:'sender@example.invalid',replyTo:'reply@example.invalid',accessCurrent:async()=>true};
{
 const f=fixture();let sent=0;
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,mode:'log',send:async()=>{sent++;return{accepted:true,messageId:'never'}}});
 assert.equal(sent,0);assert.equal(f.row.recipientDeliveryStatus,'LOGGED_ONLY');assert.equal(f.row.adminDeliveryStatus,'LOGGED_ONLY');
}
{
 const f=fixture(),messages=[];
 const send=async message=>{messages.push(message);if(message.to[0]===f.row.recipientEmail){assert.deepEqual(message.cc,['representative@example.invalid']);assert.ok(message.text.includes('BAF-SAI'));assert.ok(message.text.includes('PROFILE'));assert.ok(!message.text.includes('PRIVATE_INTERNAL_PURPOSE'));assert.ok(message.text.includes('/login?next=%2Ffrench-ward%2Fdossiers%2Fdossier'));}return{accepted:true,messageId:'message-'+messages.length}};
 await Promise.all([deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send}),deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send})]);
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send});
 assert.equal(messages.length,2);assert.equal(messages.find(message=>message.to[0]==='admin@example.invalid').cc,undefined);assert.equal(f.row.recipientDeliveryStatus,'ACCEPTED');assert.equal(f.row.adminDeliveryStatus,'ACCEPTED');assert.equal(f.logs.length,2);
}
{
 const f=fixture();let sent=0;
 const send=async()=>{sent++;throw new Error('timeout')};
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send});
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send});
 assert.equal(sent,2);assert.equal(f.row.recipientDeliveryStatus,'DELIVERY_UNKNOWN');assert.equal(f.row.adminDeliveryStatus,'DELIVERY_UNKNOWN');
}
{
 const f=fixture(),targets=[];
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,accessCurrent:async()=>false,send:async message=>{targets.push(message.to[0]);return{accepted:true,messageId:'admin'}}});
 assert.deepEqual(targets,['admin@example.invalid']);assert.equal(f.row.recipientDeliveryStatus,'FAILED');assert.equal(f.row.adminDeliveryStatus,'ACCEPTED');
}
{
 const f=fixture();let sent=0;
 const result=await deliverRepresentativeBuyerDossierWithClient({...options,actorUserId:'other',client:f.client,send:async()=>{sent++;return{accepted:true,messageId:'never'}}});
 assert.equal(sent,0);assert.equal(result.persistenceIssue,true);
}
{
 const f=fixture();f.row.recipientDeliveryStatus='SENDING';let sent=0;
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send:async()=>{sent++;return{accepted:true,messageId:'admin'}}});
 assert.equal(sent,1);assert.equal(f.row.recipientDeliveryStatus,'SENDING');
}
{
 const f=fixture(),messages=[];f.row.actor.email=null;
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send:async message=>{messages.push(message);return{accepted:true,messageId:'admin'}}});
 assert.equal(f.row.recipientDeliveryStatus,'FAILED');assert.equal(f.row.recipientDeliveryError,'REPRESENTATIVE_CC_UNAVAILABLE');assert.deepEqual(messages.map(message=>message.to[0]),['admin@example.invalid']);
}
{
 const f=fixture(),messages=[];f.row.actor.email=f.row.recipientEmail;
 await deliverRepresentativeBuyerDossierWithClient({...options,client:f.client,send:async message=>{messages.push(message);return{accepted:true,messageId:'mock'}}});
 assert.equal(messages.find(message=>message.to[0]===f.row.recipientEmail).cc,undefined);
}
console.log('BUYER_DOSSIER_DELIVERY_MOCK_OK: one combined recipient message, separate Admin status, concurrent mock claims/replay, log mode, uncertain delivery, stale access, wrong actor and held SENDING, linked actor CC, missing-CC denial, and no duplicate recipient.');
