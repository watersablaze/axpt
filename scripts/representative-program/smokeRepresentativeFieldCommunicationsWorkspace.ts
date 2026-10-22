import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const stage = read(
  "app/representative/WorkspaceStage.tsx",
);

const workspace = read(
  "app/representative/RepresentativeWorkspaceView.tsx",
);

const field = read(
  "app/representative/FieldCommunications.tsx",
);

const adminPreview = read(
  "app/admin/representative-program/participants/[participantId]/workspace-preview/page.tsx",
);

assert.match(
  stage,
  /\["communications", "Field Communications"\]/,
);

assert.match(
  stage,
  /communications: ReactNode/,
);

assert.match(
  stage,
  /const requested = new URLSearchParams\(window\.location\.search\)\.get\("view"\)/,
);

assert.match(
  stage,
  /communications,[\s\S]*guide,/,
);

assert.match(
  workspace,
  /import FieldCommunications from "\.\/FieldCommunications"/,
);

assert.match(
  workspace,
  /communications=\{[\s\S]*<FieldCommunications[\s\S]*previewMode=\{operatorPreview\}[\s\S]*initialField=\{previewField\}/,
);


assert.match(
  workspace,
  /loadRepresentativeFieldCommunicationsWithClient/,
);

assert.match(
  workspace,
  /operatorPreview[\s\S]*loadRepresentativeFieldCommunicationsWithClient/,
);

assert.match(
  workspace,
  /initialField=\{previewField\}/,
);

assert.doesNotMatch(
  field,
  /id: "preview-participant"/,
);

assert.match(
  workspace,
  /fieldContextType=CUP_RESOURCE/,
);

assert.match(
  workspace,
  /fieldContextId=\$\{encodeURIComponent\(resource\.id\)\}/,
);

assert.match(
  adminPreview,
  /<RepresentativeWorkspaceView[\s\S]*operatorPreview[\s\S]*previewParticipantId=\{participant\.id\}/,
);

assert.match(
  field,
  /if \(previewMode\) \{[\s\S]*return;/,
);

assert.match(
  field,
  /previewMode\s*&&\s*!interactionPreview[\s\S]*\|\|[\s\S]*!entryOpen/,
);

assert.match(
  field,
  /FIELD ENTRY \/\/ PREVIEW/,
);

assert.match(
  field,
  /disabled=\{[\s\S]*previewMode[\s\S]*&&[\s\S]*!interactionPreview[\s\S]*\}/,
);

assert.match(
  field,
  /disabled=\{[\s\S]*sending[\s\S]*\|\|[\s\S]*!body\.trim\(\)[\s\S]*\}/,
);

assert.match(
  field,
  /if \(previewMode\) \{[\s\S]*return;/,
);

assert.match(
  field,
  /FIELD ENTRY \/\/ PREVIEW/,
);

console.log(
  "✓ ARP Field Communications canonical workspace integration smoke passed",
);
