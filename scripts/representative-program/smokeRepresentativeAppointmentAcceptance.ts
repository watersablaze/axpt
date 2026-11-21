import assert from "node:assert/strict";
import {
  acceptRepresentativeAppointmentWithClient as accept,
  loadRepresentativeAppointmentReview as load,
} from "../../src/domains/instruments/representative-program/application/representativeAppointmentAcceptance";

async function main() {
  const evidence: Array<{
    id: string;
    recordedByUserId: string;
    recordedAt: Date;
    subjectId: string;
    metadata: unknown;
  }> = [];
  let events = 0;

  const appointment = {
    id: "appointment-a",
    participantId: "participant-a",
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    scope: {
      appointmentForm: "INDIVIDUAL_REPRESENTATION",
      masterAgreementReference: "MA-a",
    },
    effectiveAt: null,
    expiresAt: null,
    endedAt: null,
    participant: {
      id: "participant-a",
      userId: "user-a",
      displayName: "Test Representative",
      standing: "PROVISIONAL",
      onboardingIntake: {
        status: "ADMITTED",
        admittedParticipantId: "participant-a",
        masterAgreementInstrumentId: "master-a",
        masterAgreementInstrument: {
          id: "master-a",
          reference: "MA-a",
          kind: "REPRESENTATIVE_PROGRAM_AGREEMENT",
          status: "EXECUTED",
        },
      },
    },
    instrument: {
      id: "instrument-a",
      reference: "APPT-a",
      title: "Test Appointment",
      kind: "REPRESENTATIVE_APPOINTMENT",
      status: "DRAFT",
      currentVersion: 1,
      evidence,
    },
  };

  const fake = {
    representativeProgramAppointment: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === appointment.id ? appointment : null,
    },
    institutionalInstrument: {
      findUnique: async () => ({ id: "instrument-a", reference: "APPT-a" }),
    },
    instrumentEvidence: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const item = { id: "evidence-a", ...data };
        evidence.push(item as typeof evidence[number]);
        return item;
      },
    },
    domainEvent: {
      create: async () => { events += 1; },
    },
  } as unknown as Parameters<typeof load>[0]["client"];

  const review = await load({
    client: fake, userId: "user-a", appointmentId: "appointment-a",
  });
  assert.ok(review?.canAccept);
  assert.equal(await load({
    client: fake, userId: "admin-a", appointmentId: "appointment-a",
  }), null);

  const input = {
    client: fake,
    userId: "user-a",
    appointmentId: "appointment-a",
    reviewHash: review.reviewHash,
    confirmAcceptance: true,
  };

  await assert.rejects(
    () => accept({ ...input, confirmAcceptance: false }),
    /CONFIRMATION_REQUIRED/,
  );
  await assert.rejects(
    () => accept({ ...input, userId: "user-b" }),
    /NOT_FOUND/,
  );
  await assert.rejects(
    () => accept({ ...input, reviewHash: "stale" }),
    /REVIEW_CHANGED/,
  );
  assert.equal(evidence.length, 0);
  console.log("✓ ownership, confirmation, and reviewed configuration are required");

  appointment.instrument.status = "ACTIVE";
  await assert.rejects(() => accept(input), /STATE_CONFLICT/);
  appointment.instrument.status = "DRAFT";
  appointment.participant.standing = "SUSPENDED";
  await assert.rejects(() => accept(input), /STATE_CONFLICT/);
  appointment.participant.standing = "PROVISIONAL";
  console.log("✓ unavailable appointment and standing block acceptance");

  assert.equal((await accept(input)).accepted, true);
  assert.equal(evidence.length, 1);
  assert.equal(events, 1);
  assert.equal(evidence[0].recordedByUserId, "user-a");
  assert.equal(evidence[0].subjectId, "appointment-a");
  assert.equal(appointment.instrument.status, "DRAFT");
  assert.equal(appointment.participant.standing, "PROVISIONAL");
  assert.equal(appointment.effectiveAt, null);
  console.log("✓ acceptance records evidence without activation or standing mutation");

  assert.equal((await accept(input)).accepted, false);
  assert.equal(evidence.length, 1);
  assert.equal(events, 1);
  console.log("✓ exact acceptance replay creates no duplicate evidence or event");

  appointment.instrument.title = "Changed Appointment";
  await assert.rejects(
    () => load({ client: fake, userId: "user-a", appointmentId: "appointment-a" }),
    /EVIDENCE_CONFLICT/,
  );
  console.log("✓ changed configuration invalidates the recorded review");
  console.log("ARP_APPOINTMENT_ACCEPTANCE_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
