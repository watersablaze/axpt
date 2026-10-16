import { FRENCH_WARD_COMMERCIAL_INTAKE } from "../../src/domains/institutions/french-ward/commercial";
import { consumeInstitutionalAccessWithClient } from "../../src/domains/institutional-access/consumeInstitutionalAccessWithClient";
import { SUPPORTING_DOCUMENTS } from "../../src/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog";
import { deliverRepresentativeBuyerDossierWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeBuyerDossierWithClient";
import { resolveInstitutionalVisitorSignInWithClient } from "../../src/domains/institutional-access/resolveInstitutionalVisitorSignInWithClient";
import { loadRecipientBuyerDossierWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createRepresentativeBuyerDossierWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/createRepresentativeBuyerDossierWithClient";
import { resolveRepresentativeBuyerDossierSelectionWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeBuyerDossierSelectionWithClient";
import { seedBafoulaSourceAuthorityWithClient } from "../../src/domains/instruments/source-authority/seeds/seedBafoulaSourceAuthorityWithClient";
import { projectFrenchWardInstitutionalProfile } from "../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { resolveInstitutionalAccessWithClient } from "../../src/domains/institutional-access/resolveInstitutionalAccessWithClient";

const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.match(url.pathname, /^\/arp_buyer_dossier_qa_[a-f0-9]{12}$/);
assert.equal(process.env.ARP_BUYER_DOSSIER_LOCAL_TEST, url.pathname.slice(1));
const client = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const prefix = "profile-invite-qa-" + randomUUID();
const actorId = prefix + "-actor";
const participantId = prefix + "-participant";
const instrumentId = prefix + "-instrument";
const partyId = prefix + "-party";
const appointmentId = prefix + "-appointment";
const packageId = prefix + "-pack";
const resourceId = prefix + "-resource";
const profile = projectFrenchWardInstitutionalProfile();
const recipientEmail = prefix + "@example.invalid";
const input = {
  includeLoiAccess: false,
  resourceReleaseIds: [resourceId, prefix + "-source-resource"], reviewHash: "0".repeat(64), recipientName: "Local Visitor",
  recipientEmail, recipientOrganization: "Local QA Institution",
  purpose: "Isolated database acceptance", idempotencyKey: randomUUID(),
};
const adminRecipients = ["local-admin@example.invalid"];
const run = (fields = input, db = client) => createRepresentativeBuyerDossierWithClient({ client: db, userId: actorId, fields, adminRecipients });
async function denied(code: string) {
  const count = await client.institutionalAccessGrant.count();
  await assert.rejects(() => run(), (error: unknown) => error instanceof Error && error.message === code);
  assert.equal(await client.institutionalAccessGrant.count(), count);
  assert.equal(await client.representativeBuyerDossier.count(), 0);
  assert.equal(await client.user.count({ where: { email: recipientEmail } }), 0);
}
async function main() {
  const identity: Array<{ database: string }> = await client.$queryRaw`SELECT current_database() AS database`;
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
      module: module as "REPRESENTATION", state: ["REPRESENTATION", "DOCUMENTS"].includes(module) ? "RELEASED" as const : "WITHHELD" as const,
    })) },
  } });
  await client.commercialUtilityPackResourceRelease.create({ data: {
    id: resourceId, packageId, module: "REPRESENTATION", resourceType: "STRUCTURED_CONTENT",
    resourceId: profile.reference, state: "RELEASED", canView: true, canTransmit: false,
  } });
  const seeded = await seedBafoulaSourceAuthorityWithClient({ client, actorUserId: actorId });
  await client.commercialUtilityPackResourceRelease.create({ data: {
    id: prefix + "-source-resource", packageId, module: "DOCUMENTS", resourceType: "INSTITUTIONAL_INSTRUMENT",
    resourceId: seeded.instrument.id, state: "RELEASED", canView: true, canTransmit: false,
  } });
  const baselineEvents = await client.domainEvent.count();
  await denied("DOSSIER_NOT_AUTHORIZED");
  await client.commercialUtilityPackResourceRelease.update({ where: { id: resourceId }, data: { canTransmit: true } });
  await denied("DOSSIER_NOT_AUTHORIZED"); // Source withholding denies the whole selection.
  await client.commercialUtilityPackResourceRelease.update({ where: { id: prefix + "-source-resource" }, data: { canTransmit: true } });
  await client.representativeProgramParticipant.update({ where: { id: participantId }, data: { standing: "SUSPENDED" } });
  await denied("DOSSIER_NOT_AUTHORIZED");
  await client.representativeProgramParticipant.update({ where: { id: participantId }, data: { standing: "ACTIVE" } });
  await client.instrumentAuthority.updateMany({ where: { instrumentId, authorityKey: "ARP.INTRODUCTION" }, data: { revokedAt: new Date() } });
  await denied("DOSSIER_NOT_AUTHORIZED");
  await client.instrumentAuthority.updateMany({ where: { instrumentId, authorityKey: "ARP.INTRODUCTION" }, data: { revokedAt: null } });
  console.log("✓ Withheld transmission, suspension, and revoked introduction deny all grant/account writes.");

  const selection = await resolveRepresentativeBuyerDossierSelectionWithClient({
    client, userId: actorId, appointmentId, resourceReleaseIds: input.resourceReleaseIds,
  });
  assert.equal(selection.allowed, true);
  if (!selection.allowed) throw new Error("LOCAL_SELECTION_DENIED");
  input.reviewHash = selection.reviewHash;
  await assert.rejects(() => run({ ...input, reviewHash: "0".repeat(64) }), /DOSSIER_REVIEW_CHANGED/);
  assert.equal(await client.institutionalAccessGrant.count(), 0);
  // Inject only the final audit failure; all preceding writes use real PostgreSQL.
  const failing = new Proxy(client, {
    get(target, property) {
      if (property === "$transaction") return async (callback: (tx: unknown) => Promise<unknown>, options: object) =>
        target.$transaction(async (tx: unknown) => callback(new Proxy(tx as object, {
          get(transaction, key) {
            if (key === "domainEvent") return { create: async () => { throw new Error("INJECTED_AUDIT_FAILURE"); } };
            const value = Reflect.get(transaction, key);
            return typeof value === "function" ? value.bind(transaction) : value;
          },
        })), options);
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as PrismaClient;
  await assert.rejects(() => run(input, failing), /INJECTED_AUDIT_FAILURE/);
  assert.equal(await client.user.count({ where: { email: recipientEmail } }), 0);
  assert.equal(await client.institutionalAccessRequest.count(), 0);
  assert.equal(await client.institutionalAccessGrant.count(), 0);
  assert.equal(await client.representativeBuyerDossier.count(), 0);
  assert.equal(await client.representativeBuyerDossierItem.count(), 0);
  assert.equal(await client.domainEvent.count(), baselineEvents);
  console.log("✓ Final audit failure rolls back recipient provisioning, request, grant, and introduction.");

  const first = await run();
  assert.equal(first.replay, false);
  const replay = await run();
  assert.equal(replay.replay, true);
  assert.equal(first.dossier.id, replay.dossier.id);
  const reordered = await run({ ...input, resourceReleaseIds: [...input.resourceReleaseIds].reverse() });
  assert.equal(reordered.dossier.id, first.dossier.id);
  const sourceItem = first.dossier.items.find((item: { kind: string }) => item.kind === "SOURCE_AUTHORITY");
  assert.ok(sourceItem);
  const sourceGrant = await client.institutionalAccessGrant.findUniqueOrThrow({ where: { id: sourceItem.grantId }, include: { request: true } });
  assert.equal(sourceGrant.scope, "SOURCE_AUTHORITY_VIEW");
  assert.equal(sourceGrant.resourceReference, sourceItem.resourceReference);
  assert.equal(sourceGrant.resourceVersion, sourceItem.resourceVersion);
  assert.equal(sourceGrant.recipientUserId, first.dossier.recipientUserId);
  assert.equal(sourceGrant.request.status, "APPROVED");

  await assert.rejects(() => run({ ...input, purpose: "Changed content" }), /IDEMPOTENCY_CONFLICT/);
  assert.equal(await client.institutionalAccessGrant.count(), 2);
  assert.equal(await client.representativeBuyerDossierItem.count(), 2);
  assert.ok(first.dossier.items.every((item: { canDownload: boolean }) => item.canDownload === false));
  assert.equal(await client.representativeBuyerDossier.count(), 1);
  assert.equal(await client.institutionalAccessEvent.count(), 6);
  assert.equal(await client.domainEvent.count(), baselineEvents + 1);
  assert.equal(await client.userRole.count({ where: { userId: first.dossier.recipientUserId } }), 0);
  assert.equal(await client.representativeProgramParticipant.count({ where: { userId: first.dossier.recipientUserId } }), 0);
  console.log("✓ Exact replay creates one dossier with two item grants and audit chains; changed submission is rejected without extra privileges.");
  const readDossier = (userId = first.dossier.recipientUserId) => loadRecipientBuyerDossierWithClient({
    client, dossierId: first.dossier.id, userId, email: recipientEmail,
  });
  const visible = await readDossier();
  assert.ok(visible);
  assert.equal(visible.items.length, 2);
  assert.ok(visible.items.every(item => item.available));
  assert.ok(visible.items.every(item => !item.canDownload));
  const sourcePublication = visible.items.find(item => item.publication?.kind === "SOURCE_AUTHORITY")?.publication;
  assert.equal(sourcePublication?.kind, "SOURCE_AUTHORITY");
  if (sourcePublication?.kind !== "SOURCE_AUTHORITY") throw new Error("LOCAL_SOURCE_NOT_RETURNED");
  assert.equal(sourcePublication.content.audience, "RECIPIENT");
  assert.equal(sourcePublication.content.operatorRecord.length, 0);
  assert.equal(await readDossier(actorId), null);
  await client.representativeBuyerDossier.update({where:{id:first.dossier.id},data:{revokedAt:new Date()}});
  assert.equal(await readDossier(), null);
  await client.representativeBuyerDossier.update({where:{id:first.dossier.id},data:{revokedAt:null}});
  await client.institutionalAccessGrant.update({where:{id:sourceItem.grantId},data:{revokedAt:new Date()}});
  const partial = await readDossier();
  assert.equal(partial?.items.find(item=>item.id===sourceItem.id)?.publication, null);
  assert.equal(partial?.items.filter(item=>item.available).length, 1);
  await client.institutionalAccessGrant.update({where:{id:sourceItem.grantId},data:{revokedAt:null}});
  await client.representativeBuyerDossierItem.update({where:{id:sourceItem.id},data:{recipientContentHash:"0".repeat(64)}});
  assert.equal((await readDossier())?.items.find(item=>item.id===sourceItem.id)?.publication, null);
  await client.representativeBuyerDossierItem.update({where:{id:sourceItem.id},data:{recipientContentHash:sourceItem.recipientContentHash}});
  await client.commercialUtilityPackResourceRelease.update({where:{id:sourceItem.resourceReleaseId},data:{state:"WITHDRAWN"}});
  assert.equal((await readDossier())?.items.find(item=>item.id===sourceItem.id)?.publication, null);
  await client.commercialUtilityPackResourceRelease.update({where:{id:sourceItem.resourceReleaseId},data:{state:"RELEASED"}});
  assert.ok((await readDossier())?.items.every(item=>item.available));
  console.log("✓ Recipient dossier serves both full projections; wrong identity, revocation, changed content and resource withdrawal deny access.");
  let providerCalls = 0;
  const delivery = await deliverRepresentativeBuyerDossierWithClient({
    client, dossierId: first.dossier.id, actorUserId: actorId, mode: "log",
    from: "local-sender@example.invalid", replyTo: "local-reply@example.invalid",
    accessCurrent: async (tx, record) => {
      const view = await loadRecipientBuyerDossierWithClient({ client: tx, dossierId: record.id,
        userId: record.recipientUserId, email: record.recipientEmail });
      return Boolean(view?.items.length && view.items.every(item => item.available));
    },
    send: async () => { providerCalls++; throw new Error("PROVIDER_MUST_NOT_RUN_IN_LOG_MODE"); },
  });
  assert.equal(delivery.persistenceIssue, false);
  assert.equal(providerCalls, 0);
  const delivered = await client.representativeBuyerDossier.findUniqueOrThrow({ where: { id: first.dossier.id } });
  assert.equal(delivered.recipientDeliveryStatus, "LOGGED_ONLY");
  assert.equal(delivered.adminDeliveryStatus, "LOGGED_ONLY");
  console.log("✓ Both delivery channels commit LOGGED_ONLY against real PostgreSQL without contacting a provider.");
  const accessInput = {
    client, identity: { userId: first.dossier.recipientUserId, email: recipientEmail },
    scope: "PROFILE_VIEW" as const, action: "VIEW" as const,
    resourceReference: profile.reference, resourceVersion: profile.version,
  };
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, true);
  assert.equal((await resolveInstitutionalAccessWithClient({ ...accessInput, identity: { userId: actorId, email: recipientEmail } })).allowed, false);
  await client.institutionalAccessGrant.update({ where: { id: first.dossier.items.find((item: { kind: string }) => item.kind === "INSTITUTIONAL_PROFILE")!.grantId }, data: { revokedAt: new Date() } });
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
  await client.institutionalAccessGrant.update({ where: { id: first.dossier.items.find((item: { kind: string }) => item.kind === "INSTITUTIONAL_PROFILE")!.grantId }, data: { revokedAt: null, expiresAt: new Date(0) } });
  assert.equal((await resolveInstitutionalAccessWithClient(accessInput)).allowed, false);
  const visitorInput = { client, userId: first.dossier.recipientUserId, email: recipientEmail };
  assert.equal((await resolveInstitutionalVisitorSignInWithClient(visitorInput)).eligible, true);
  await client.institutionalAccessGrant.update({where:{id:sourceItem.grantId},data:{revokedAt:new Date()}});
  assert.equal((await resolveInstitutionalVisitorSignInWithClient(visitorInput)).eligible, false);
  console.log("✓ A valid Source Authority grant supports visitor sign-in; no remaining valid grant denies it.");
  assert.equal(await client.emailLog.count(), 2);
  console.log("✓ Resulting grant admits its recipient; wrong identity, revocation, and expiry deny access.");
  const supportingIds: string[]=[];
  for(const publication of SUPPORTING_DOCUMENTS){
    const id=prefix+"-"+publication.kind;supportingIds.push(id);
    await client.commercialUtilityPackResourceRelease.create({data:{id,packageId,module:"DOCUMENTS",resourceType:"DOCUMENT",resourceId:publication.reference,
      label:publication.title,state:"RELEASED",canView:true,canTransmit:true,
      metadata:{publicationVersion:publication.version,sha256:publication.sha256,byteLength:publication.byteLength,mimeType:"application/pdf",sourceFileName:publication.sourceFileName,
        fileUrl:`https://zjlswvetvtzvn453.private.blob.vercel-storage.com/arp/supporting-publications/${publication.reference}/v${publication.version}/${publication.sha256}.pdf`}}});
  }
  const fiveIds=[...input.resourceReleaseIds,...supportingIds];
  const fiveReview=await resolveRepresentativeBuyerDossierSelectionWithClient({client,userId:actorId,appointmentId,resourceReleaseIds:fiveIds});
  assert.ok(fiveReview.allowed);if(!fiveReview.allowed)throw new Error("FIVE_MATERIAL_REVIEW_DENIED");
  const five=await run({...input,resourceReleaseIds:fiveIds,reviewHash:fiveReview.reviewHash,idempotencyKey:randomUUID(),recipientEmail:prefix+"-five@example.invalid"});
  const recipient={client,dossierId:five.dossier.id,userId:five.dossier.recipientUserId,email:five.dossier.recipientEmail};
  const fiveVisible=await loadRecipientBuyerDossierWithClient(recipient);
  assert.equal(fiveVisible?.items.length,5);assert.ok(fiveVisible?.items.every(item=>item.available));
  assert.ok(five.dossier.items.every((item:{canDownload:boolean})=>!item.canDownload));
  const supportingItems=five.dossier.items.filter((item:{kind:string})=>["DECLARATION_OF_TRUST","RESELLER_AGREEMENT","SANCTIONS_SCREENING"].includes(item.kind));
  assert.equal(supportingItems.length,3);
  const supportingGrants=await client.institutionalAccessGrant.findMany({where:{id:{in:supportingItems.map((item:{grantId:string})=>item.grantId)}}});
  assert.ok(supportingGrants.every((grant:{scope:string})=>grant.scope==="SUPPORTING_DOCUMENT_VIEW"));
  const otherGrants=five.dossier.items.filter((item:{kind:string})=>["INSTITUTIONAL_PROFILE","SOURCE_AUTHORITY"].includes(item.kind));
  await client.institutionalAccessGrant.updateMany({where:{id:{in:otherGrants.map((item:{grantId:string})=>item.grantId)}},data:{revokedAt:new Date()}});
  assert.equal((await resolveInstitutionalVisitorSignInWithClient({client,userId:recipient.userId,email:recipient.email})).eligible,true);
  await client.commercialUtilityPackResourceRelease.update({where:{id:supportingIds[0]},data:{state:"WITHDRAWN"}});
  const withdrawn=await loadRecipientBuyerDossierWithClient(recipient);
  assert.equal(withdrawn?.items.filter(item=>item.available).length,2);
  assert.equal(await loadRecipientBuyerDossierWithClient({...recipient,userId:actorId}),null);
  console.log("✓ Five-material real database dossier binds three supporting grants, supports visitor login and denies withdrawn resources without implied downloads.");
  assert.equal(first.dossier.loiAccessGrantId, null);
  assert.equal(await client.institutionalAccessGrant.count({where:{scope:"LOI_INTAKE_ACCESS"}}),0);
  const loiReview=await resolveRepresentativeBuyerDossierSelectionWithClient({client,userId:actorId,appointmentId,
    resourceReleaseIds:input.resourceReleaseIds,includeLoiAccess:true});
  assert.ok(loiReview.allowed);if(!loiReview.allowed)throw new Error("LOI_REVIEW_DENIED");
  assert.notEqual(loiReview.reviewHash,selection.reviewHash);
  const loiFields={...input,includeLoiAccess:true,reviewHash:loiReview.reviewHash,
    recipientEmail:prefix+"-loi@example.invalid",idempotencyKey:randomUUID()};
  const beforeLoi={grants:await client.institutionalAccessGrant.count(),requests:await client.institutionalAccessRequest.count(),
    dossiers:await client.representativeBuyerDossier.count(),events:await client.institutionalAccessEvent.count()};
  await assert.rejects(()=>run({...loiFields,reviewHash:selection.reviewHash}),/DOSSIER_REVIEW_CHANGED/);
  await assert.rejects(()=>run(loiFields,failing),/INJECTED_AUDIT_FAILURE/);
  assert.equal(await client.institutionalAccessGrant.count(),beforeLoi.grants);
  assert.equal(await client.institutionalAccessRequest.count(),beforeLoi.requests);
  assert.equal(await client.representativeBuyerDossier.count(),beforeLoi.dossiers);
  assert.equal(await client.institutionalAccessEvent.count(),beforeLoi.events);
  assert.equal(await client.user.count({where:{email:loiFields.recipientEmail}}),0);
  // Communication is independently required for the optional intake invitation.
  await client.instrumentAuthority.updateMany({where:{instrumentId,authorityKey:"ARP.COMMUNICATION"},data:{revokedAt:new Date()}});
  await assert.rejects(()=>run(loiFields),/DOSSIER_NOT_AUTHORIZED/);
  assert.equal(await client.institutionalAccessGrant.count(),beforeLoi.grants);
  await client.instrumentAuthority.updateMany({where:{instrumentId,authorityKey:"ARP.COMMUNICATION"},data:{revokedAt:null}});
  const loiDossier=await run(loiFields);
  assert.ok(loiDossier.dossier.loiAccessGrantId);
  assert.equal((await run(loiFields)).dossier.id,loiDossier.dossier.id);
  await assert.rejects(()=>run({...loiFields,includeLoiAccess:false}),/IDEMPOTENCY_CONFLICT/);
  assert.equal(await client.institutionalAccessGrant.count(),beforeLoi.grants+3);
  assert.equal(loiDossier.dossier.items.length,2);
  const loiGrant=await client.institutionalAccessGrant.findUniqueOrThrow({where:{id:loiDossier.dossier.loiAccessGrantId!}});
  assert.equal(loiGrant.scope,"LOI_INTAKE_ACCESS");
  assert.equal(loiGrant.resourceReference,FRENCH_WARD_COMMERCIAL_INTAKE.reference);
  assert.equal(loiGrant.resourceVersion,FRENCH_WARD_COMMERCIAL_INTAKE.version);
  assert.equal(loiGrant.expiresAt.getTime(),loiDossier.dossier.expiresAt.getTime());
  const loiIdentity={userId:loiDossier.dossier.recipientUserId,email:loiFields.recipientEmail};
  const loiAccess={client,identity:loiIdentity,scope:"LOI_INTAKE_ACCESS" as const,action:"VIEW_FORM" as const,
    resourceReference:FRENCH_WARD_COMMERCIAL_INTAKE.reference,resourceVersion:FRENCH_WARD_COMMERCIAL_INTAKE.version};
  assert.equal((await resolveInstitutionalAccessWithClient(loiAccess)).allowed,true);
  assert.equal((await resolveInstitutionalAccessWithClient({...loiAccess,identity:{...loiIdentity,userId:actorId}})).allowed,false);
  const loiReception={client,dossierId:loiDossier.dossier.id,...loiIdentity};
  assert.equal((await loadRecipientBuyerDossierWithClient(loiReception))?.loiAccess?.available,true);
  const submitLoi=()=>consumeInstitutionalAccessWithClient({client,identity:loiIdentity,scope:"LOI_INTAKE_ACCESS",
    action:"SUBMIT_INTAKE",resourceReference:FRENCH_WARD_COMMERCIAL_INTAKE.reference,
    resourceVersion:FRENCH_WARD_COMMERCIAL_INTAKE.version,execute:async tx=>{
      const intake=await tx.transactionIntake.create({data:{reference:prefix+"-LOI-"+randomUUID(),
        submitterName:"Local Buyer",submitterEmail:loiIdentity.email,submitterRole:"BUYER",
        declarationAccuracy:true,declarationNoObligation:true,declarationNoCommission:true}});
      return {value:intake.id,intakeId:intake.id,intakeReference:intake.reference};
    }});
  const intakeId=await submitLoi();assert.ok(await client.transactionIntake.findUnique({where:{id:intakeId}}));
  const intakes=await client.transactionIntake.count();
  await client.representativeBuyerDossier.update({where:{id:loiDossier.dossier.id},data:{revokedAt:new Date()}});
  assert.equal((await resolveInstitutionalAccessWithClient(loiAccess)).allowed,false);
  await assert.rejects(submitLoi,/INSTITUTIONAL_ACCESS_DENIED/);
  assert.equal(await client.transactionIntake.count(),intakes);
  await client.representativeBuyerDossier.update({where:{id:loiDossier.dossier.id},data:{revokedAt:null,expiresAt:new Date(0)}});
  assert.equal((await resolveInstitutionalAccessWithClient(loiAccess)).allowed,false);
  await assert.rejects(submitLoi,/INSTITUTIONAL_ACCESS_DENIED/);
  await client.representativeBuyerDossier.update({where:{id:loiDossier.dossier.id},data:{expiresAt:loiGrant.expiresAt}});
  await client.institutionalAccessGrant.update({where:{id:loiGrant.id},data:{revokedAt:new Date()}});
  assert.equal((await resolveInstitutionalAccessWithClient(loiAccess)).allowed,false);
  assert.equal((await loadRecipientBuyerDossierWithClient(loiReception))?.loiAccess?.available,false);
  await assert.rejects(submitLoi,/INSTITUTIONAL_ACCESS_DENIED/);
  await client.institutionalAccessGrant.update({where:{id:loiGrant.id},data:{revokedAt:null,expiresAt:new Date(0)}});
  assert.equal((await resolveInstitutionalAccessWithClient(loiAccess)).allowed,false);
  assert.equal(await client.transactionIntake.count(),intakes);
  assert.equal(await client.userRole.count({where:{userId:loiIdentity.userId}}),0);
  console.log("✓ LOI is opt-in and review-bound; independent authority, atomic rollback, replay, real intake consumption, dossier/grant revocation and expiry enforced.");
  console.log("ARP_BUYER_DOSSIER_LOCAL_DATABASE_OK");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Acceptance failed"); process.exitCode = 1; })
  .finally(() => client.$disconnect());
