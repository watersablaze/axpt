import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";

const read = (
  path: string,
) =>
  readFileSync(
    path,
    "utf8",
  );

const schema =
  read(
    "prisma/schema.prisma",
  );

for (
  const target of [
    "REPRESENTATIVE_PROGRAM_PARTICIPANT",
    "REPRESENTATIVE_APPOINTMENT",
    "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE",
  ]
) {
  assert.match(
    schema,
    new RegExp(
      `\\b${target}\\b`,
    ),
  );
}

const vocabulary =
  read(
    "src/domains/communications/operational/operationalVocabulary.ts",
  );

const resolver =
  read(
    "src/domains/communications/operational/operationalTargetPointer.ts",
  );

const application =
  read(
    "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
  );

const route =
  read(
    "app/api/representative/communications/route.ts",
  );

assert.match(
  application,
  /arp-field:\$\{participantId\}/,
);

assert.match(
  application,
  /participant\.createdByUserId/,
);

assert.match(
  application,
  /operator\.isAdmin/,
);

assert.match(
  application,
  /participant\.userId !== userId/,
);

assert.match(
  application,
  /appointment\.participantId !==\s*participant\.id/,
);

assert.match(
  application,
  /resource\.package\.participantId !==\s*participant\.id/,
);

assert.match(
  application,
  /resource\.state !==\s*"RELEASED"/,
);

assert.match(
  application,
  /GENERAL_OPERATIONS/,
);

assert.doesNotMatch(
  application,
  /COMMUNICATIONS_MESSAGE_SEND/,
);

assert.doesNotMatch(
  application,
  /COMMUNICATIONS_ACCESS/,
);

assert.doesNotMatch(
  application,
  /authorityKernel/,
);

assert.match(
  route,
  /await getPrincipal\(\)/,
);

assert.match(
  route,
  /principal\.userId/,
);

assert.doesNotMatch(
  route,
  /userId:\s*field\(/,
);

for (
  const target of [
    "REPRESENTATIVE_PROGRAM_PARTICIPANT",
    "REPRESENTATIVE_APPOINTMENT",
    "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE",
  ]
) {
  assert.match(
    vocabulary,
    new RegExp(
      `"${target}"`,
    ),
  );

  assert.match(
    resolver,
    new RegExp(
      `case "${target}"`,
    ),
  );
}

console.log(
  "✓ ARP Field Communications V1 contract smoke passed",
);
