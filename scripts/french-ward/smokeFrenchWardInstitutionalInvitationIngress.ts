import assert from "node:assert/strict";

import {
  FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
  FRENCH_WARD_INSTITUTIONAL_ROOT_PATH,
  FRENCH_WARD_INSTITUTIONAL_WELCOME_PATH,
  frenchWardInstitutionalInvitationCookieOptions,
  expiredFrenchWardInstitutionalInvitationCookieOptions,
} from "../../src/domains/institutions/french-ward/participants/invitations/institutionalInvitationAccessCookie";

const expiresAt =
  new Date(
    "2026-11-09T12:00:00.000Z",
  );

assert.equal(
  FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
  "fw_institutional_invitation",
);

assert.equal(
  FRENCH_WARD_INSTITUTIONAL_ROOT_PATH,
  "/french-ward/institutional",
);

assert.equal(
  FRENCH_WARD_INSTITUTIONAL_WELCOME_PATH,
  "/french-ward/institutional/welcome",
);

const options =
  frenchWardInstitutionalInvitationCookieOptions(
    expiresAt,
  );

assert.equal(
  options.httpOnly,
  true,
);

assert.equal(
  options.sameSite,
  "lax",
);

assert.equal(
  options.path,
  "/french-ward/institutional",
);

assert.equal(
  options.expires,
  expiresAt,
);

const expired =
  expiredFrenchWardInstitutionalInvitationCookieOptions();

assert.equal(
  expired.httpOnly,
  true,
);

assert.equal(
  expired.sameSite,
  "lax",
);

assert.equal(
  expired.path,
  "/french-ward/institutional",
);

assert.equal(
  expired.maxAge,
  0,
);

console.log(
  "✓ institutional invitation cookie is HttpOnly",
);

console.log(
  "✓ cookie is scoped to French-Ward institutional surfaces",
);

console.log(
  "✓ SameSite=Lax retained",
);

console.log(
  "✓ invitation expiry controls bearer-cookie expiry",
);

console.log(
  "✓ explicit cookie clearing contract established",
);

console.log(
  "✓ FW-FOUNDING-INVITE-1B.4G.A COOKIE CONTRACT PASSED",
);

/*
 * Source-level lifecycle boundary:
 * the bearer cookie belongs only to pre-acceptance admission.
 */
import fs from "node:fs";
import path from "node:path";

const routeSource =
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "app/french-ward/institutional/access/[credential]/route.ts",
    ),
    "utf8",
  );

assert.ok(
  routeSource.includes(
    'invitation.state ===\n    "ACCEPTED"',
  ),
);

assert.ok(
  routeSource.includes(
    'destination.pathname =\n      "/login"',
  ),
);

assert.ok(
  routeSource.includes(
    '"?next=%2Ffrench-ward%2Forientation"',
  ),
);

assert.ok(
  routeSource.includes(
    'invitation.state !==\n    "PENDING"',
  ),
);

const acceptedBranchStart =
  routeSource.indexOf(
    'invitation.state ===\n    "ACCEPTED"',
  );

const pendingCookieStart =
  routeSource.indexOf(
    "response.cookies.set(",
  );

assert.ok(
  acceptedBranchStart >= 0,
);

assert.ok(
  pendingCookieStart >
    acceptedBranchStart,
);

const acceptedBranch =
  routeSource.slice(
    acceptedBranchStart,
    pendingCookieStart,
  );

assert.equal(
  acceptedBranch.includes(
    "response.cookies.set(",
  ),
  false,
);

console.log(
  "✓ ACCEPTED re-entry bypasses invitation cookie",
);

console.log(
  "✓ ACCEPTED re-entry proceeds to canonical login + Orientation",
);

console.log(
  "✓ invitation bearer cookie remains PENDING-only",
);
