import assert from "node:assert/strict";

import {
  globalMotherCycleV2Plan as plan,
} from "../../src/domains/instruments/definitions/globalMotherCycleV2Plan";

import {
  resolveChamberV2ParticipationEligibility,
  type ChamberV2EligibilityEvidence,
} from "../../src/domains/instruments/global-mother/resolveChamberV2ParticipationEligibility";

const participant = plan.participants[0];

const identity = {
  userId: "test-gm-participant",
  participantKey: participant.key,
  standing: "VERIFIED" as const,
};

const capacity = {
  userId: identity.userId,
  institution: participant.institution,
  capacity: participant.capacity,
  standing: "VERIFIED" as const,
};

const admission = {
  userId: identity.userId,
  participantKey: participant.key,
  instrumentReference: plan.instrumentReference,
  cycleLabel: plan.cycleLabel,
  standing: "ADMITTED" as const,
};

const room = {
  standing: "CANONICAL" as const,
  operationalRoomId: "test-operational-room",
  clientRoomId: plan.communications.clientRoomId,
};

function assess(evidence: ChamberV2EligibilityEvidence = {}) {
  return resolveChamberV2ParticipationEligibility(
    participant.key,
    evidence,
  );
}

assert.equal(assess().standing, "PLANNED");

assert.equal(
  assess({
    identity: { ...identity, standing: "UNVERIFIED" },
  }).standing,
  "IDENTITY_UNRESOLVED",
);

assert.equal(
  assess({ identity }).standing,
  "CAPACITY_UNVERIFIED",
);

assert.equal(
  assess({ identity, capacity }).standing,
  "ADMISSION_NOT_ESTABLISHED",
);

assert.equal(
  assess({ identity, capacity, admission }).standing,
  "ROOM_NOT_ESTABLISHED",
);

const eligible = assess({
  identity,
  capacity,
  admission,
  room,
});

assert.equal(eligible.standing, "ELIGIBLE");
assert.equal(
  eligible.operationalRoomId,
  "test-operational-room",
);

assert.equal(
  assess({
    identity,
    capacity: {
      ...capacity,
      institution: "Different institution",
    },
    admission,
    room,
  }).standing,
  "CAPACITY_UNVERIFIED",
);

assert.equal(
  assess({
    identity,
    capacity,
    admission: {
      ...admission,
      cycleLabel: "Chamber V1",
    },
    room,
  }).standing,
  "ADMISSION_NOT_ESTABLISHED",
);

assert.equal(
  assess({
    identity,
    capacity,
    admission: {
      ...admission,
      standing: "REVOKED",
    },
    room,
  }).standing,
  "WITHHELD",
);

assert.equal(
  assess({
    identity,
    capacity,
    admission,
    room: {
      ...room,
      standing: "AMBIGUOUS",
    },
  }).standing,
  "WITHHELD",
);

assert.equal(
  assess({
    identity,
    capacity,
    admission,
    room: {
      ...room,
      operationalRoomId: null,
    },
  }).standing,
  "ROOM_NOT_ESTABLISHED",
);

assert.equal(
  assess({
    identity,
    capacity,
    admission,
    room: {
      ...room,
      clientRoomId: "other-cycle-room",
    },
  }).standing,
  "ROOM_NOT_ESTABLISHED",
);

for (const planned of plan.participants) {
  assert.equal(
    resolveChamberV2ParticipationEligibility(planned.key).standing,
    "PLANNED",
  );
}

assert.throws(
  () => resolveChamberV2ParticipationEligibility(
    "NAMA_CHANCELLOR" as typeof participant.key,
  ),
  /GM_V2_PARTICIPANT_NOT_PLANNED/,
);

assert.equal(plan.standing, "PREPARATION");
assert.equal(plan.issuanceEnabled, false);
assert.equal(plan.deliveryEnabled, false);

console.log(
  "PASS: GM V2 eligibility, separation, revocation, " +
  "cycle scope, room binding, and preparation posture",
);
