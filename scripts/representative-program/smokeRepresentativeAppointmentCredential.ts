import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  loadRepresentativeAppointmentReview,
} from "../../src/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import {
  loadAppointmentCertificateIssuanceBasis,
  issueRepresentativeAppointmentCredential,
  loadOwnedIssuedAppointmentCertificate,
} from "../../src/domains/instruments/representative-program/application/issueRepresentativeAppointmentCredential";

async function main() {
  const acceptance: any[] = [];
  const certificates: any[] = [];
  const events: any[] = [];
  let renders = 0;
  let stores = 0;
  let locks = 0;
  let issuerAllowed = true;
  let storeFails = false;
  let eventFails = false;
  let changeDuringUpload = false;

  const appointment = {
    id: "appointment-a",
    participantId: "participant-a",
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    scope: {
      appointmentForm: "INDIVIDUAL_REPRESENTATION",
      masterAgreementReference: "MA-001",
    },
    effectiveAt: new Date("2026-01-01T00:00:00Z"),
    expiresAt: null,
    endedAt: null,
    participant: {
      id: "participant-a",
      userId: "owner-a",
      displayName: "Test Representative",
      standing: "ACTIVE",
      onboardingIntake: {
        status: "ADMITTED",
        admittedParticipantId: "participant-a",
        masterAgreementInstrumentId: "agreement-a",
        masterAgreementInstrument: {
          id: "agreement-a",
          reference: "MA-001",
          kind: "REPRESENTATIVE_PROGRAM_AGREEMENT",
          status: "EXECUTED",
        },
      },
    },
    instrument: {
      id: "instrument-a",
      reference: "APPT-001",
      title: "Test Appointment",
      kind: "REPRESENTATIVE_APPOINTMENT",
      status: "ACTIVE",
      currentVersion: 1,
      evidence: acceptance,
    },
  };

  const fake: any = {
    user: {
      findUnique: async () => ({
        isAdmin: true,
        email: issuerAllowed ? "connect@axpt.io" : "other-admin@example.test",
      }),
    },
    representativeProgramAppointment: {
      findUnique: async () => appointment,
    },
    institutionalInstrument: {
      findUnique: async () => ({
        id: appointment.instrument.id,
        reference: appointment.instrument.reference,
      }),
    },
    instrumentEvidence: {
      findMany: async () => certificates,
      findUnique: async ({ where }: any) =>
        certificates.find(item => item.id === where.id) ?? null,
      create: async ({ data }: any) => {
        const item = { id: `certificate-${certificates.length + 1}`, ...data };
        certificates.push(item);
        return item;
      },
    },
    domainEvent: {
      create: async ({ data }: any) => {
        if (eventFails) throw new Error("TEST_EVENT_FAILURE");
        events.push(data);
        return data;
      },
    },
    $queryRaw: async () => { locks += 1; return []; },
    $transaction: async (callback: any) => {
      const certificateCount = certificates.length;
      const eventCount = events.length;
      try { return await callback(fake); }
      catch (error) {
        certificates.splice(certificateCount);
        events.splice(eventCount);
        throw error;
      }
    },
  };

  const initial = await loadRepresentativeAppointmentReview({
    client: fake, userId: "owner-a", appointmentId: appointment.id,
  });
  assert.ok(initial);
  const acceptedAt = new Date("2025-12-31T00:00:00Z");
  acceptance.push({
    id: "acceptance-a",
    recordedByUserId: "owner-a",
    recordedAt: acceptedAt,
    subjectId: appointment.id,
    metadata: {
      acceptedByUserId: "owner-a",
      participantId: appointment.participantId,
      appointmentId: appointment.id,
      instrumentReference: appointment.instrument.reference,
      reviewHash: initial.reviewHash,
      acceptedAt: acceptedAt.toISOString(),
    },
  });

  const reviewInput = {
    client: fake, appointmentId: appointment.id, actorUserId: "issuer-a",
  };
  const reviewed = await loadAppointmentCertificateIssuanceBasis(reviewInput);
  const bytes = Buffer.from("%PDF-1.7\nTEST CERTIFICATE\n%%EOF");

  const input = {
    ...reviewInput,
    expectedBasisHash: reviewed.basisHash,
    confirmIssue: true,
    signatureHash: "80169c0c6a46fc165b2999220e9a4cee38e1193d22788deda49c2dfcfe0fbee2",
    sealHash: "b5387470d30435e040aaae3d59aca784c409dd58a775a9e8c0bf9b1673680bd3",
    render: async () => { renders += 1; return bytes; },
    store: async (value: { sha256: string }) => {
      stores += 1;
      assert.equal(value.sha256,
        createHash("sha256").update(bytes).digest("hex"));
      if (storeFails) throw new Error("TEST_STORAGE_FAILURE");
      if (changeDuringUpload) appointment.participant.displayName = "Changed Name";
      return {
        uri: "https://test.private.blob.vercel-storage.com/arp/appointment-certificates/appointment-a/test.pdf",
        access: "private" as const,
      };
    },
  };

  issuerAllowed = false;
  await assert.rejects(() => issueRepresentativeAppointmentCredential(input),
    /ISSUER_REQUIRED/);
  issuerAllowed = true;
  await assert.rejects(() => issueRepresentativeAppointmentCredential({
    ...input, confirmIssue: false,
  }), /CONFIRMATION_REQUIRED/);
  await assert.rejects(() => issueRepresentativeAppointmentCredential({
    ...input, expectedBasisHash: "stale",
  }), /REVIEW_CHANGED/);
  await assert.rejects(() => issueRepresentativeAppointmentCredential({
    ...input, signatureHash: "different",
  }), /ASSET_CONFLICT/);
  assert.equal(stores, 0);
  console.log("✓ issuer, explicit confirmation, exact review, and assets are required");

  storeFails = true;
  await assert.rejects(() => issueRepresentativeAppointmentCredential(input),
    /TEST_STORAGE_FAILURE/);
  storeFails = false;
  assert.equal(certificates.length, 0);
  assert.equal(events.length, 0);

  changeDuringUpload = true;
  await assert.rejects(() => issueRepresentativeAppointmentCredential(input),
    /REVIEW_CHANGED/);
  changeDuringUpload = false;
  appointment.participant.displayName = "Test Representative";
  assert.equal(certificates.length, 0);
  console.log("✓ storage failure and changed configuration prevent issuance evidence");

  eventFails = true;
  await assert.rejects(() => issueRepresentativeAppointmentCredential(input),
    /TEST_EVENT_FAILURE/);
  eventFails = false;
  assert.equal(certificates.length, 0);
  assert.equal(events.length, 0);
  console.log("✓ audit failure rolls back certificate evidence");

  assert.equal((await issueRepresentativeAppointmentCredential(input)).issued, true);
  assert.equal(certificates.length, 1);
  assert.equal(events.length, 1);
  assert.ok(locks > 0);
  const beforeReplay = { renders, stores };
  assert.equal((await issueRepresentativeAppointmentCredential(input)).issued, false);
  assert.deepEqual({ renders, stores }, beforeReplay);
  assert.equal(certificates.length, 1);
  assert.equal(events.length, 1);
  console.log("✓ exact replay preserves one certificate and event without another upload");

  const owned = (userId = "owner-a") => loadOwnedIssuedAppointmentCertificate({
    client: fake, userId, appointmentId: appointment.id,
  });
  assert.ok(await owned());
  assert.equal(await owned("issuer-a"), null);
  appointment.participant.standing = "SUSPENDED";
  assert.equal(await owned(), null);
  appointment.participant.standing = "ACTIVE";
  appointment.endedAt = new Date() as any;
  assert.equal(await owned(), null);
  appointment.endedAt = null;
  console.log("✓ owner access is required; suspension and termination block download");

  assert.equal(acceptance.length, 1);
  assert.equal(appointment.instrument.status, "ACTIVE");
  assert.equal(appointment.participant.standing, "ACTIVE");
  console.log("✓ issuance preserves acceptance, appointment status, and standing");
  console.log("ARP_APPOINTMENT_CERTIFICATE_ISSUANCE_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
