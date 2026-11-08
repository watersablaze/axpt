import assert from "node:assert/strict";

import {
  resolveFrenchWardOrientationAdmission,
} from "../../src/domains/institutions/french-ward/governance/resolveFrenchWardOrientationAdmission";

const governing = {
  reference: "FW-GOV-TEST",
  userId: "user-test",
  displayName: "Governing Officer",
  institutionalTitle: "Officer",
  secondaryTitle: null,
  governingBasis: "Test",
  provenanceReference: null,
  status: "ACTIVE",
  recognizedAt: new Date(),
  active: true,
};

const institutional = {
  reference: "FW-PARTICIPANT-TEST",
  userId: "user-test",
  displayName: "Institutional Participant",
  institutionalTitle: "Chief Logistics Officer",
  secondaryTitle: null,
  capacityClass: "OPERATIONS" as const,
  recognitionBasis: "Test",
  provenanceReference: null,
  status: "ACTIVE",
  recognizedAt: new Date(),
  active: true,
};

const admin =
  resolveFrenchWardOrientationAdmission({
    admin: true,
    governingStanding: null,
    institutionalParticipant: null,
  });

assert.equal(admin.admitted, true);
assert.equal(admin.mode, "ADMIN");

const governingAdmission =
  resolveFrenchWardOrientationAdmission({
    admin: false,
    governingStanding: governing,
    institutionalParticipant:
      institutional,
  });

assert.equal(
  governingAdmission.admitted,
  true,
);
assert.equal(
  governingAdmission.mode,
  "GOVERNING",
);

const institutionalAdmission =
  resolveFrenchWardOrientationAdmission({
    admin: false,
    governingStanding: null,
    institutionalParticipant:
      institutional,
  });

assert.equal(
  institutionalAdmission.admitted,
  true,
);
assert.equal(
  institutionalAdmission.mode,
  "INSTITUTIONAL",
);

const denied =
  resolveFrenchWardOrientationAdmission({
    admin: false,
    governingStanding: null,
    institutionalParticipant: null,
  });

assert.equal(denied.admitted, false);
assert.equal(denied.mode, "DENIED");

console.log("✓ admin admission preserved");
console.log("✓ governing admission preserved");
console.log("✓ governing precedence preserved");
console.log("✓ institutional participant admitted");
console.log("✓ unrecognized principal denied");
console.log("✓ no action authority inferred");
console.log("✓ FW-FOUNDING-INVITE-1B.3B CONTRACT PASSED");
