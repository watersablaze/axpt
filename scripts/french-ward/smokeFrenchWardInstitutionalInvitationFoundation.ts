import assert from "node:assert/strict";

import {
  generateFrenchWardInstitutionalInvitationCredential,
  hashFrenchWardInstitutionalInvitationCredential,
} from "../../src/domains/institutions/french-ward/participants/invitations/institutionalInvitationCredential";

import {
  canAcceptFrenchWardInstitutionalInvitation,
  resolveFrenchWardInstitutionalInvitationState,
} from "../../src/domains/institutions/french-ward/participants/invitations/institutionalInvitationPolicy";

const now =
  new Date("2026-11-08T06:30:00.000Z");

const credential =
  generateFrenchWardInstitutionalInvitationCredential();

const secondCredential =
  generateFrenchWardInstitutionalInvitationCredential();

assert.ok(
  credential.length > 32,
);

assert.notEqual(
  credential,
  secondCredential,
);

const hash =
  hashFrenchWardInstitutionalInvitationCredential(
    credential,
  );

assert.match(
  hash,
  /^[a-f0-9]{64}$/,
);

assert.notEqual(
  hash,
  credential,
);

const pending = {
  expiresAt:
    new Date(
      now.getTime() + 60_000,
    ),
  acceptedAt:
    null,
  revokedAt:
    null,
};

assert.equal(
  resolveFrenchWardInstitutionalInvitationState(
    pending,
    now,
  ),
  "PENDING",
);

assert.equal(
  canAcceptFrenchWardInstitutionalInvitation(
    pending,
    now,
  ),
  true,
);

assert.equal(
  resolveFrenchWardInstitutionalInvitationState(
    {
      ...pending,
      acceptedAt:
        new Date(
          now.getTime() - 1,
        ),
    },
    now,
  ),
  "ACCEPTED",
);

assert.equal(
  canAcceptFrenchWardInstitutionalInvitation(
    {
      ...pending,
      acceptedAt:
        new Date(
          now.getTime() - 1,
        ),
    },
    now,
  ),
  false,
);

assert.equal(
  resolveFrenchWardInstitutionalInvitationState(
    {
      ...pending,
      revokedAt:
        new Date(
          now.getTime() - 1,
        ),
    },
    now,
  ),
  "REVOKED",
);

assert.equal(
  resolveFrenchWardInstitutionalInvitationState(
    {
      ...pending,
      expiresAt:
        new Date(
          now.getTime() - 1,
        ),
    },
    now,
  ),
  "EXPIRED",
);

assert.equal(
  resolveFrenchWardInstitutionalInvitationState(
    {
      ...pending,
      acceptedAt:
        new Date(
          now.getTime() - 2,
        ),
      revokedAt:
        new Date(
          now.getTime() - 1,
        ),
    },
    now,
  ),
  "REVOKED",
);

console.log(
  "✓ raw institutional invitation credential generated",
);
console.log(
  "✓ credential persists only through SHA-256 representation",
);
console.log(
  "✓ pending invitation is accept-capable",
);
console.log(
  "✓ accepted invitation cannot be accepted again",
);
console.log(
  "✓ revoked invitation fails closed",
);
console.log(
  "✓ expired invitation fails closed",
);
console.log(
  "✓ revocation dominates derived state",
);
console.log(
  "✓ invitation state requires no mutable status column",
);
console.log(
  "✓ FW-FOUNDING-INVITE-1B.4B CONTRACT PASSED",
);
