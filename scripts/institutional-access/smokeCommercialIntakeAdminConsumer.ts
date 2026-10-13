import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(path, "utf8");

const page =
  read("app/admin/institutional-access/page.tsx");

const operator =
  read(
    "app/admin/institutional-access/InstitutionalAccessOperator.tsx",
  );

const decision =
  read(
    "app/api/admin/institutional-access/decision/route.ts",
  );

const revoke =
  read(
    "app/api/admin/institutional-access/revoke/route.ts",
  );

const consumer =
  read(
    "src/domains/institutional-access/manageCommercialIntakeAccessWithClient.ts",
  );

assert.equal(
  page.includes('where: { scope: "PROFILE_VIEW" }'),
  false,
  "Admin page must not hide LOI_INTAKE_ACCESS records",
);

assert.match(
  operator,
  />Institutional Access<\/h1>/,
);

assert.match(
  decision,
  /accessRequest\.scope === "LOI_INTAKE_ACCESS"/,
);

assert.match(
  decision,
  /decideCommercialIntakeAccessWithClient/,
);

assert.match(
  revoke,
  /grant\.scope === "LOI_INTAKE_ACCESS"/,
);

assert.match(
  revoke,
  /revokeCommercialIntakeAccessWithClient/,
);

assert.match(
  consumer,
  /FRENCH_WARD_COMMERCIAL_INTAKE\.accessScope/,
);

assert.match(
  consumer,
  /FRENCH_WARD_COMMERCIAL_INTAKE\.reference/,
);

assert.match(
  consumer,
  /FRENCH_WARD_COMMERCIAL_INTAKE\.version/,
);

assert.match(
  consumer,
  /\/login\?next=%2Ffrench-ward%2Ftransaction-intake/,
);

assert.match(
  consumer,
  /provisionRecipient:\s*true/,
);

console.log(
  "COMMERCIAL_INTAKE_ADMIN_CONSUMER_OK",
);
