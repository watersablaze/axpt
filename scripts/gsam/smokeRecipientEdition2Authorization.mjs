import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const room = read(
  "app/french-ward/instruments/gsam-sco/page.tsx"
);

const page = read(
  "app/french-ward/instruments/gsam-sco/[variant]/page.tsx"
);

const resolver = read(
  "src/domains/instruments/transaction-documents/gsamRecipientFrozenDocument.ts"
);

const registry = read(
  "src/domains/institutional-access/gsamScoAccessResources.ts"
);

const access = read(
  "src/domains/institutional-access/resolveInstitutionalAccessWithClient.ts"
);

const edition2PageReference =
  'resourceReference: `GSAM-SCO-PROGRAM-${program.quantityMt}MT-2026-002`';

assert.equal(
  page.split(edition2PageReference).length - 1,
  1,
  "Document page must authorize exactly one Edition 2 reference"
);

assert.ok(
  !page.includes("resourceReference: program.reference,"),
  "Legacy Edition 1 authorization must not remain"
);

assert.ok(
  room.includes(
    "GSAM-SCO-PROGRAM-${item.record.quantityMt}MT-2026-002"
  ),
  "Reception room must use Edition 2"
);

for (const quantity of [100, 1000]) {
  const reference =
    `GSAM-SCO-PROGRAM-${quantity}MT-2026-002`;

  assert.ok(
    registry.includes(`"${reference}"`),
    `Edition 2 registry missing ${quantity} MT`
  );

  assert.ok(
    resolver.includes(`reference: "${reference}"`),
    `Frozen resolver missing ${quantity} MT`
  );

  console.log(`PASS: ${quantity} MT Edition 2 alignment`);
}

for (const source of [room, page, resolver]) {
  assert.ok(
    source.includes("resolveInstitutionalAccessWithClient"),
    "Each recipient entry must preserve access resolution"
  );
}

assert.ok(
  access.includes("recipientUserId: params.identity.userId"),
  "Resolver must bind authenticated recipient"
);

assert.ok(
  access.includes("revokedAt: null"),
  "Revoked grants must be excluded"
);

assert.ok(
  access.includes("expiresAt: { gt: now }"),
  "Expired grants must be excluded"
);

assert.ok(
  page.includes("getAuthorizedFrozenGsamDocument"),
  "Document page must retain frozen-artifact protection"
);

console.log(
  "PASS: Edition 2 page, room, resolver and registry alignment"
);

console.log(
  "PASS: recipient binding, expiration and revocation guards"
);

console.log(
  "PASS: frozen-artifact authorization retained"
);
