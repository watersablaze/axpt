import assert from "node:assert/strict";

import {
  globalMotherCycleV2Plan as plan,
} from "../../src/domains/instruments/definitions/globalMotherCycleV2Plan";

import {
  resolveGlobalMotherChamberV2PersistedPosture as resolve,
  type PersistedPostureInput,
} from "../../src/domains/instruments/global-mother/resolveGlobalMotherChamberV2PersistedPosture";

const participant = plan.participants[0];
const now = new Date("2026-10-28T12:00:00.000Z");

const admission = {
  instrumentReference: plan.instrumentReference,
  cycleLabel: plan.cycleLabel,
  participantKey: participant.key,
  institution: participant.institution,
  capacity: participant.capacity,
  participantUserId: "synthetic-user",
  standing: "ADMITTED",
  capacityEvidenceReference: "synthetic-assertion",
  capacityVerifiedByUserId: "synthetic-verifier",
  capacityVerifiedAt: now,
  admittedByUserId: "synthetic-decider",
  admittedAt: now,
  decisionReason: "Synthetic test only",
  revokedByUserId: null,
  revokedAt: null,
  revocationReason: null,
};

const binding = {
  instrumentReference: plan.instrumentReference,
  cycleLabel: plan.cycleLabel,
  standing: "BOUND",
  operationalRoomId: "synthetic-room",
  boundByUserId: "synthetic-operator",
  boundAt: now,
  bindingReason: "Synthetic binding",
  revokedByUserId: null,
  revokedAt: null,
  revocationReason: null,
};

const room = {
  id: "synthetic-room",
  clientRoomId: plan.communications.clientRoomId,
  roomClass: plan.communications.roomClass,
};

const base: PersistedPostureInput = {
  participantKey: participant.key,
  admissions: [admission],
  bindings: [binding],
  rooms: [room],
  linkedUserExists: true,
};

function withheld(
  input: PersistedPostureInput,
  reason: string,
) {
  const result = resolve(input);
  assert.equal(result.standing, "WITHHELD");
  assert.ok(result.reasons.includes(reason), reason);
  assert.notEqual(result.eligibility.standing, "ELIGIBLE");
}

const ready = resolve(base);
assert.equal(ready.standing, "STRUCTURALLY_READY");
assert.equal(ready.independentCapacityVerified, false);
assert.equal(ready.independentIdentityVerified, false);
assert.notEqual(ready.eligibility.standing, "ELIGIBLE");

withheld(
  { ...base, admissions: [] },
  "ADMISSION_MISSING",
);

withheld(
  {
    ...base,
    admissions: [{ ...admission, participantKey: "OTHER" }],
  },
  "ADMISSION_SCOPE_OR_CAPACITY_MISMATCH",
);

withheld(
  {
    ...base,
    admissions: [{ ...admission, participantUserId: "wrong-user" }],
    linkedUserExists: false,
  },
  "PARTICIPANT_USER_UNRESOLVED",
);

withheld(
  {
    ...base,
    admissions: [{ ...admission, cycleLabel: "Chamber V1" }],
  },
  "ADMISSION_SCOPE_OR_CAPACITY_MISMATCH",
);

withheld(
  {
    ...base,
    admissions: [{
      ...admission,
      standing: "REVOKED",
      revokedByUserId: "synthetic-revoker",
      revokedAt: now,
      revocationReason: "Synthetic revocation",
    }],
  },
  "ADMISSION_REVOKED",
);

withheld(
  {
    ...base,
    admissions: [{ ...admission, capacityEvidenceReference: null }],
  },
  "ADMISSION_EVIDENCE_INCOMPLETE",
);

withheld(
  { ...base, bindings: [] },
  "ROOM_BINDING_MISSING",
);

withheld(
  {
    ...base,
    bindings: [{
      ...binding,
      standing: "REVOKED",
      revokedAt: now,
      revokedByUserId: "synthetic-revoker",
      revocationReason: "Synthetic revocation",
    }],
  },
  "ROOM_BINDING_REVOKED",
);

withheld(
  {
    ...base,
    bindings: [{ ...binding, cycleLabel: "Chamber V1" }],
  },
  "ROOM_BINDING_CYCLE_MISMATCH",
);

withheld(
  {
    ...base,
    rooms: [{ ...room, id: "different-room" }],
  },
  "CANONICAL_ROOM_MISMATCH",
);

withheld(
  {
    ...base,
    rooms: [room, { ...room, id: "duplicate-room" }],
  },
  "ROOM_TOPOLOGY_AMBIGUOUS",
);

withheld(
  {
    ...base,
    admissions: [admission, { ...admission }],
  },
  "ADMISSION_AMBIGUOUS",
);

for (const planned of plan.participants) {
  const empty = resolve({
    participantKey: planned.key,
    admissions: [],
    bindings: [],
    rooms: [],
    linkedUserExists: false,
  });

  assert.equal(empty.standing, "WITHHELD");
  assert.notEqual(empty.eligibility.standing, "ELIGIBLE");
}

assert.equal(plan.standing, "PREPARATION");
assert.equal(plan.issuanceEnabled, false);
assert.equal(plan.deliveryEnabled, false);

console.log(
  "PASS: GM-V2.1B.2A persisted posture, cycle scope, " +
  "revocation, room topology and independent-capacity withholding",
);
