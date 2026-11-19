import assert from "node:assert/strict";
import fs from "node:fs";

const page =
  fs.readFileSync(
    "app/transaction-intake/page.tsx",
    "utf8",
  );

const api =
  fs.readFileSync(
    "app/api/transaction-intake/route.ts",
    "utf8",
  );

const submitter = fs.readFileSync(
  "src/domains/institutions/french-ward/commercial/submitFrenchWardCommercialIntakeWithAccess.ts",
  "utf8",
);

const requestRoute =
  fs.readFileSync(
    "app/api/french-ward/transaction-intake/access-request/route.ts",
    "utf8",
  );

assert.match(
  page,
  /action:\s*"VIEW_FORM"/,
);

assert.match(
  page,
  /resolveFrenchWardCommercialIntakeRequestAccessWithClient/,
);

assert.match(
  page,
  /allowed=\{access.allowed\}/,
);

assert.match(
  api,
  /submitFrenchWardCommercialIntakeWithAccess/,
);

assert.match(
  api,
  /action:\s*"SUBMIT_INTAKE"/,
);

assert.match(
  submitter,
  /InstitutionalAccessDeniedError/,
);

assert.match(
  submitter,
  /execute:\s*async \(tx\) => \{[\s\S]*?tx\.transactionIntake\.create[\s\S]*?tx\.institutionalMatter\.create/,
);

assert.match(submitter, /scope:\s*FRENCH_WARD_COMMERCIAL_INTAKE\s*\.accessScope/);

assert.match(
  requestRoute,
  /requestInstitutionalAccessWithClient/,
);

assert.match(
  requestRoute,
  /FRENCH_WARD_COMMERCIAL_INTAKE/,
);

assert.doesNotMatch(
  requestRoute,
  /body\.(scope|resourceReference|resourceVersion)/,
);

console.log(
  "PASS: commercial intake form and mutation are bound to server-owned institutional access.",
);
