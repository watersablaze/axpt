import assert from "node:assert/strict";
import { loadRepresentativeAuthorityRegister as load } from
  "../../src/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";
import { REPRESENTATIVE_AUTHORITY_KEY } from
  "../../src/domains/instruments/representative-program/contracts";

async function main() {
  let appointmentReads = 0;
  let authorityReads = 0;

  const appointment = {
    id: "appointment-a",
    participantId: "participant-a",
    instrumentId: "instrument-a",
    instrumentPartyId: "party-a",
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    effectiveAt: new Date("2020-01-01T00:00:00Z"),
    expiresAt: null,
    endedAt: null,
    participant: { userId: "owner-a", standing: "ACTIVE" },
    instrument: {
      kind: "REPRESENTATIVE_APPOINTMENT",
      status: "ACTIVE",
      reference: "TEST-APPT-001",
    },
    instrumentParty: { instrumentId: "instrument-a" },
  };

  const candidates: any[] = [];
  const fake = {
    representativeProgramAppointment: {
      findUnique: async () => {
        appointmentReads++;
        return appointment;
      },
    },
    instrumentAuthority: {
      findMany: async () => {
        authorityReads++;
        return candidates;
      },
    },
  } as any;

  const read = (userId = "owner-a") =>
    load({ client: fake, appointmentId: appointment.id, userId });

  let register = await read();
  assert.ok(register);
  assert.equal(register.entries.length,
    Object.values(REPRESENTATIVE_AUTHORITY_KEY).length);
  assert.ok(register.entries.every(entry =>
    !entry.exercisable && entry.reason === "AUTHORITY_NOT_RECORDED"));
  assert.equal(appointmentReads, 1);
  assert.equal(authorityReads, 1);
  console.log("✓ all authority categories resolve using exactly two database reads");

  assert.equal(await read("admin-a"), null);
  assert.equal(authorityReads, 1);
  console.log("✓ foreign ownership blocks the authority query");

  const key = Object.values(REPRESENTATIVE_AUTHORITY_KEY)[0];
  candidates.push({
    id: "authority-a",
    instrumentId: appointment.instrumentId,
    authorityKey: key,
    title: "Test authority",
    authorityClass: "DELEGATED",
    holderPartyId: appointment.instrumentPartyId,
    action: "TEST",
    conditions: {},
    effectiveAt: new Date("2020-01-01T00:00:00Z"),
    expiresAt: null,
    revokedAt: null,
    createdByUserId: "issuer-a",
  });

  register = await read();
  assert.equal(register?.entries.find(entry => entry.key === key)?.exercisable, true);
  assert.equal(register?.entries.filter(entry => entry.exercisable).length, 1);

  appointment.participant.standing = "SUSPENDED";
  register = await read();
  assert.equal(register?.entries.find(entry => entry.key === key)?.reason,
    "PARTICIPANT_SUSPENDED");
  assert.ok(register?.entries.every(entry => !entry.exercisable));
  appointment.participant.standing = "ACTIVE";
  console.log("✓ canonical delegation and standing rules remain enforced");

  candidates.push({ ...candidates[0], id: "authority-b" });
  await assert.rejects(read, /AUTHORITY_RESOLUTION_CONTRADICTION/);
  console.log("✓ contradictory operative authority still fails closed");

  console.log("ARP_AUTHORITY_REGISTER_TWO_READS_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
