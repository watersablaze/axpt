import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const panelPath =
  path.resolve(
    "app/admin/representative-program/" +
      "RepresentativeCommercialUtilityPackPanel.tsx",
  );

const inspectorPath =
  path.resolve(
    "app/admin/representative-program/" +
      "RepresentativeIntakeInspector.tsx",
  );

const panel =
  fs.readFileSync(
    panelPath,
    "utf8",
  );

const inspector =
  fs.readFileSync(
    inspectorPath,
    "utf8",
  );

assert.match(
  panel,
  /commercial-utility-packs\/prepare/,
);

assert.match(
  panel,
  /participantId/,
);

assert.match(
  panel,
  /Prepare Commercial Utility Pack/,
);

assert.match(
  panel,
  /Prepare \/ Refresh CUP Again/,
);

assert.match(
  panel,
  /registeredResources/,
);

assert.match(
  panel,
  /unavailableSources/,
);

assert.match(
  panel,
  /eligibleModules/,
);

assert.match(
  panel,
  /blockedModules/,
);

assert.match(
  panel,
  /NOT PERFORMED/,
);

assert.match(
  panel,
  /Source Authority is not selected automatically/,
);

assert.doesNotMatch(
  panel,
  /releaseCommercialUtilityPackResource/,
);

assert.doesNotMatch(
  panel,
  /reconcileCommercialUtilityPackReleaseState/,
);

assert.doesNotMatch(
  panel,
  /sourceAuthorityInstrumentReference/,
  "initial operator panel must not silently select Source Authority",
);

assert.match(
  inspector,
  /RepresentativeCommercialUtilityPackPanel/,
);

assert.match(
  inspector,
  /intake\.status === "ADMITTED" && intake\.admittedParticipantId/,
);

const cupPosition =
  inspector.indexOf(
    "<RepresentativeCommercialUtilityPackPanel",
  );

const appointmentPosition =
  inspector.indexOf(
    "<RepresentativeAppointmentPreparationPanel",
  );

assert.ok(
  cupPosition >= 0,
);

assert.ok(
  appointmentPosition >= 0,
);

assert.ok(
  cupPosition <
    appointmentPosition,
  "CUP preparation must appear before Appointment preparation",
);

console.log(
  "✓ CUP panel invokes operator preparation route",
);

console.log(
  "✓ panel exposes preparation/readiness summary only",
);

console.log(
  "✓ panel performs no release or reconciliation action",
);

console.log(
  "✓ Source Authority remains unselected unless separately governed",
);

console.log(
  "✓ CUP control is mounted only for admitted participant",
);

console.log(
  "✓ CUP control precedes Appointment preparation in operator rail",
);

console.log(
  "CUP_1F_OPERATOR_PANEL_CONTRACT_OK",
);
