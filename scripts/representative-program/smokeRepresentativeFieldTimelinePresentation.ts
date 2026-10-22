import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const field = readFileSync(
  "app/representative/FieldCommunications.tsx",
  "utf8",
);

const css = readFileSync(
  "app/representative/field-communications.module.css",
  "utf8",
);

assert.match(
  field,
  /FIELD:\/\/COMMUNICATIONS/,
);

assert.match(
  field,
  /\+ ENTER COMMUNICATION/,
);

assert.match(
  field,
  /FIELD ENTRY \/\/ PREVIEW/,
);

assert.match(
  field,
  /const \[entryOpen, setEntryOpen\] = useState\(false\)/,
);

assert.match(
  field,
  /message\.sender\.role === "FRENCH_WARD"/,
);

assert.match(
  field,
  /FW\.ADMINISTRATION/,
);

assert.match(
  field,
  /institutional_observation/,
);

assert.match(
  field,
  /communication != authority/,
);

assert.match(
  field,
  /appointment = separately governed/,
);

assert.match(
  field,
  /resources = separately governed/,
);

assert.match(
  field,
  /className=\{styles\.entryTrigger\}/,
);

assert.match(
  field,
  /onClick=\{\(\)\s*=>\s*setEntryOpen\(true\)\s*\}/,
);

assert.match(
  field,
  /onSubmit=\{submit\}/,
);

assert.match(
  css,
  /\.terminalHeader\s*\{/,
);

assert.match(
  css,
  /\.terminalMeta\s*\{/,
);

assert.match(
  css,
  /\.dispatch\s*\{/,
);

assert.match(
  css,
  /\.authorityBoundary\s*\{/,
);

assert.match(
  css,
  /\.entryTrigger\s*\{/,
);

assert.match(
  css,
  /\.messageControl textarea\s*\{/,
);

assert.doesNotMatch(
  css,
  /font-size:\s*clamp\(1\.8rem/,
);

assert.doesNotMatch(
  field,
  /<h1[^>]*className=\{styles\.title\}/,
);



assert.match(
  field,
  /INTERACTION_PREVIEW/,
);

assert.match(
  field,
  /OPEN INTERACTION PREVIEW/,
);

assert.match(
  field,
  /RETURN TO CANONICAL VIEW/,
);

assert.match(
  field,
  /SIMULATE ENTRY/,
);

assert.match(
  field,
  /setSimulatedMessages/,
);

assert.match(
  field,
  /previewMode &&[\s\S]*interactionPreview/,
);

assert.match(
  field,
  /simulation:[\s\S]*not_stored/,
);

assert.match(
  css,
  /\.previewModeToggle\s*\{/,
);

assert.match(
  css,
  /\.simulatedDispatch\s*\{/,
);

console.log(
  "✓ ARP Field Terminal V1 presentation contract passed",
);
