import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { loadRepresentativeAppointmentReview } from "../../src/domains/instruments/representative-program/application/representativeAppointmentAcceptance";
import { loadRepresentativeAuthorityRegister } from "../../src/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";
import { loadRepresentativeAppointmentWorkspaceDetailsWithClient } from "../../src/domains/instruments/representative-program/application/loadRepresentativeAppointmentWorkspaceDetailsWithClient";

const db = new PrismaClient({ log: [] });
async function main() {
  const participantId = process.argv[2];
  assert.ok(participantId, "Participant ID argument required");
  const participant = await db.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: {
      userId: true,
      appointments: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } },
    },
  });
  assert.ok(participant?.userId && participant.appointments[0], "Linked appointment required");
  const userId = participant.userId;
  const appointmentId = participant.appointments[0].id;
  const at = new Date();
  const previousStarted = Date.now();
  const [appointmentReview, authorityRegister] = await Promise.all([
    loadRepresentativeAppointmentReview({ client: db, userId, appointmentId }),
    loadRepresentativeAuthorityRegister({ client: db, userId, appointmentId, at }),
  ]);
  console.log({ stage: "previousAppointmentReads", elapsedMs: Date.now() - previousStarted });
  assert.ok(appointmentReview && authorityRegister, "Existing readers must resolve");
  for (let pass = 1; pass <= 2; pass++) {
    const started = Date.now();
    const current = await loadRepresentativeAppointmentWorkspaceDetailsWithClient({
      client: db, userId, appointmentId, at,
    });
    assert.deepStrictEqual(current, { appointmentReview, authorityRegister });
    console.log({ stage: "singleAppointmentRead", pass, elapsedMs: Date.now() - started, parity: "PASS" });
  }
  for (const input of [
    { userId: userId + ":not-owner", appointmentId },
    { userId, appointmentId: "arp-parity-nonexistent-appointment" },
  ]) {
    assert.deepStrictEqual(
      await loadRepresentativeAppointmentWorkspaceDetailsWithClient({ client: db, ...input, at }),
      { appointmentReview: null, authorityRegister: null },
    );
  }
  console.log("PASS: wrong owner and missing appointment return no details");
}
main().catch(error => {
  console.error({ failed: true, code: typeof error.code === "string" ? error.code : error.name });
  process.exitCode = 1;
}).finally(() => db.$disconnect());
