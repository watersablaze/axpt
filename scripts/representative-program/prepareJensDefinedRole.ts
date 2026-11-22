import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { INITIAL_REPRESENTATIVE_APPOINTMENT_ROLE } from "../../src/domains/instruments/representative-program/application/representativeAppointmentRole";
import { INITIAL_COMMERCIAL_AUTHORITY_PLAN } from "../../src/domains/instruments/representative-program/application/appointmentCertificateAuthorities";
import { recordRepresentativeProgramAuthorityWithClient } from "../../src/domains/instruments/representative-program/commands/recordRepresentativeProgramAuthorityWithClient";
import { loadRepresentativeAppointmentReview } from "../../src/domains/instruments/representative-program/application/representativeAppointmentAcceptance";

const target = new URL(process.env.ARP_JENS_SETUP_URL || "");
assert.equal(target.hostname, "ep-cold-shape-ae1i1fz6-pooler.c-2.us-east-2.aws.neon.tech", "STOP: database endpoint differs");
assert.equal(process.env.ARP_JENS_SETUP_CONFIRM, "PREPARE_DEFINED_ROLE", "STOP: setup confirmation missing");
const client = new PrismaClient({ datasources: { db: { url: target.toString() } } });
const appointmentId = "cmuxb2qvn000bw01zf05q0wy7";
const operatorId = "cmnvt0mri0000w02q1lbj123g";
const participantId = "cmutqhfec0001l704h0fc4huy";
async function main() {
  const result = await client.$transaction(async (tx: typeof client) => {
    await tx.$queryRaw`SELECT id FROM "RepresentativeProgramAppointment" WHERE id = ${appointmentId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "InstitutionalInstrument" WHERE id = (SELECT "instrumentId" FROM "RepresentativeProgramAppointment" WHERE id = ${appointmentId}) FOR UPDATE`;
    const operator = await tx.user.findUnique({ where: { id: operatorId }, select: { email: true, isAdmin: true } });
    assert.equal(operator?.email, "connect@axpt.io"); assert.equal(operator?.isAdmin, true, "STOP: canonical operator permission missing");
    const appointment = await tx.representativeProgramAppointment.findUnique({ where: { id: appointmentId }, include: { participant: { include: { user: true } }, instrument: true } });
    assert.ok(appointment); assert.equal(appointment.participantId, participantId);
    assert.equal(appointment.participant.user?.email, "juxtaport@gmail.com");
    assert.equal(appointment.instrument.reference, "FWI-26-RP-001-APPT-001");
    assert.equal(appointment.instrument.status, "DRAFT"); assert.equal(appointment.participant.standing, "PROVISIONAL");
    assert.equal(appointment.effectiveAt, null); assert.equal(appointment.endedAt, null);
    assert.equal(await tx.instrumentEvidence.count({ where: { instrumentId: appointment.instrumentId, title: "Representative appointment acceptance" } }), 0, "STOP: acceptance already recorded; preserve it");
    const scope = appointment.scope as Record<string, unknown>;
    assert.equal(scope.appointmentForm, "INDIVIDUAL_REPRESENTATION");
    assert.equal(scope.masterAgreementReference, "FWI-26-RP-ONB-CFCC47E131-MA");
    const newScope = { ...scope, representativeRole: INITIAL_REPRESENTATIVE_APPOINTMENT_ROLE };
    const existingRole = scope.representativeRole;
    if (existingRole !== undefined) assert.deepEqual(existingRole, INITIAL_REPRESENTATIVE_APPOINTMENT_ROLE, "STOP: recorded role differs");
    const existingAuthorities = await tx.instrumentAuthority.findMany({ where: { instrumentId: appointment.instrumentId } });
    const occurredAt = new Date();
    if (existingRole === undefined) {
      assert.equal(appointment.instrument.currentVersion, 1, "STOP: instrument version advanced");
      assert.equal(existingAuthorities.length, 0, "STOP: existing authorities require review");
      await tx.representativeProgramAppointment.update({ where: { id: appointmentId }, data: { scope: newScope as any } });
      await tx.instrumentVersion.create({ data: { instrumentId: appointment.instrumentId, number: 2, status: "DRAFT", createdByUserId: operatorId } });
      await tx.institutionalInstrument.update({ where: { id: appointment.instrumentId }, data: { currentVersion: 2 } });
      await tx.domainEvent.create({ data: {
        streamType: "INSTITUTIONAL_INSTRUMENT", streamId: appointment.instrumentId,
        eventType: "REPRESENTATIVE_APPOINTMENT_ROLE_PREPARED", eventVersion: 1,
        payload: { appointmentId, participantId, previousVersion: 1, version: 2, previousScope: scope as any, scope: newScope as any },
        metadata: { actorUserId: operatorId, reason: "Define approved commercial representative role before Jens acceptance" }, occurredAt,
      } });
    } else assert.equal(appointment.instrument.currentVersion, 2);
    const keys = INITIAL_COMMERCIAL_AUTHORITY_PLAN.map(entry => entry.authorityKey);
    for (const row of existingAuthorities) assert.ok(keys.includes(row.authorityKey as any), "STOP: unexpected authority record");
    for (const plan of INITIAL_COMMERCIAL_AUTHORITY_PLAN) {
      const previous = existingAuthorities.filter((row: { authorityKey: string }) => row.authorityKey === plan.authorityKey);
      assert.ok(previous.length <= 1, "STOP: conflicting authority records");
      if (previous.length) {
        const row = previous[0]; assert.equal(row.revokedAt, null); assert.equal(row.expiresAt, null);
        assert.equal(row.authorityClass, plan.authorityClass); assert.equal(row.action, plan.action);
        assert.deepEqual(row.conditions, plan.conditions); assert.equal(row.holderPartyId, appointment.instrumentPartyId);
      } else await recordRepresentativeProgramAuthorityWithClient({ client: tx, appointmentId, actorUserId: operatorId, authorityKey: plan.authorityKey as any, authorityClass: plan.authorityClass, action: plan.action, conditions: plan.conditions, effectiveAt: occurredAt });
    }
    const review = await loadRepresentativeAppointmentReview({ client: tx, appointmentId, userId: appointment.participant.userId! });
    assert.ok(review?.representativeRole); assert.equal(review.acceptedAt, null); assert.equal(review.status, "DRAFT");
    return { reference: review.instrumentReference, version: review.instrumentVersion, role: review.representativeRole, authorityRecords: keys.length, appointmentStatus: review.status, standing: review.standing, reviewHash: review.reviewHash };
  }, { isolationLevel: "Serializable", maxWait: 30000, timeout: 60000 });
  console.log(JSON.stringify(result, null, 2));
  console.log("Prepared role and four authority records. Draft appointment remains non-operative until Jens accepts and the operator activates it.");
  console.log("No acceptance, activation, certificate issuance, material permission change, mail or deployment performed.");
}
main().catch(error => { console.error("Setup stopped:", error.code || error.name); if (/^(STOP:|\[ARP_)/.test(error.message || "")) console.error(error.message); process.exitCode = 1; }).finally(() => client.$disconnect());
