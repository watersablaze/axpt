import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const field = readFileSync(
  "app/representative/FieldCommunications.tsx",
  "utf8",
);

const styles = readFileSync(
  "app/representative/field-communications.module.css",
  "utf8",
);

assert.match(
  field,
  /type FieldTimelineItem/,
);

assert.match(
  field,
  /itemType: "MESSAGE"/,
);

assert.match(
  field,
  /itemType: "INSTITUTIONAL_REFLECTION"/,
);

assert.match(
  field,
  /field\?\.timeline && field\.timeline\.items\.length > 0/,
);

assert.match(
  field,
  /field\.timeline\.items\.map/,
);

assert.match(
  field,
  /Institutional Observation/,
);

assert.match(
  field,
  /reflection\.reflectionCode/,
);

assert.match(
  field,
  /reflection\.sourceOccurredAt/,
);

assert.match(
  field,
  /reflection\.sourceSystem/,
);

assert.match(
  field,
  /reflection\.sourceAggregateType/,
);

assert.match(
  field,
  /Recorded institutional outcome · no authority is created/,
);

assert.match(
  field,
  /message\.sender\.role === "REPRESENTATIVE"/,
);

assert.match(
  field,
  /styles\.messageInstitution/,
);

assert.doesNotMatch(
  field,
  /field\.messages\.map/,
);

assert.match(
  styles,
  /\.reflection\s*\{/,
);

assert.match(
  styles,
  /\.reflectionRecord\s*\{/,
);

assert.match(
  styles,
  /\.reflectionBadge\s*\{/,
);

assert.match(
  styles,
  /\.reflectionDoctrine\s*\{/,
);

console.log(
  "✓ ARP Field canonical timeline presentation contract passed",
);
