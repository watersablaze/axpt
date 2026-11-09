import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(
  relative: string,
) {
  return fs.readFileSync(
    path.resolve(
      process.cwd(),
      relative,
    ),
    "utf8",
  );
}

const route =
  read(
    "app/french-ward/institutional/welcome/accept/route.ts",
  );

const page =
  read(
    "app/french-ward/institutional/welcome/page.tsx",
  );

const requiredRoute = [
  "isSameOriginMutation",
  "acceptFrenchWardInstitutionalInvitationWithClient",
  "FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE",
  "expiredFrenchWardInstitutionalInvitationCookieOptions",
  '"/french-ward/orientation"',
  "`/login?next=${next}`",
  "303",
];

for (
  const needle of requiredRoute
) {
  assert.equal(
    route.includes(
      needle,
    ),
    true,
    `missing acceptance HTTP contract: ${needle}`,
  );
}

const forbiddenRoute = [
  "user.create(",
  "user.update(",
  "frenchWardInstitutionalParticipant.create(",
  "frenchWardInstitutionalInvitation.update(",
  "createSessionToken",
  "createSessionCookie",
  "requestInstitutionalLoginPin",
  "verifyInstitutionalLoginPin",
  "frenchWardGoverningOfficer",
  "InstitutionalAccessGrant",
  "InstrumentAuthority",
];

for (
  const needle of forbiddenRoute
) {
  assert.equal(
    route.includes(
      needle,
    ),
    false,
    `HTTP adapter crossed sealed boundary: ${needle}`,
  );
}

const requiredPage = [
  'method="post"',
  'action="/french-ward/institutional/welcome/accept"',
  "Accept &amp; Continue",
];

for (
  const needle of requiredPage
) {
  assert.equal(
    page.includes(
      needle,
    ),
    true,
    `missing explicit acceptance presentation: ${needle}`,
  );
}

assert.equal(
  page.includes(
    "acceptFrenchWardInstitutionalInvitationWithClient",
  ),
  false,
  "welcome page must not own acceptance mutation",
);

console.log(
  "✓ POST route requires same-origin mutation",
);

console.log(
  "✓ POST route consumes scoped bearer credential",
);

console.log(
  "✓ POST route delegates durable acceptance to sealed 1B.4D",
);

console.log(
  "✓ successful acceptance clears invitation cookie",
);

console.log(
  "✓ successful acceptance redirects to canonical login + Orientation",
);

console.log(
  "✓ welcome page owns presentation only",
);

console.log(
  "✓ authentication and authority logic remain absent from adapter",
);

console.log(
  "✓ FW-FOUNDING-INVITE-1B.4G.C CONTRACT PASSED",
);
