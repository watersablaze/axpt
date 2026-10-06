import assert from "node:assert/strict";

import {
  resolveInstitutionalSignInEligibility,
} from "../../src/domains/auth/resolveInstitutionalSignInEligibility";

function expectAudience(
  input: Parameters<
    typeof resolveInstitutionalSignInEligibility
  >[0],
  expected:
    | "ADMIN"
    | "REPRESENTATIVE"
    | null,
) {
  const result =
    resolveInstitutionalSignInEligibility(input);

  if (expected === null) {
    assert.equal(result.eligible, false);
    assert.equal(result.audience, null);
    return;
  }

  assert.equal(result.eligible, true);
  assert.equal(result.audience, expected);
}

/*
 * Admin eligibility remains canonical.
 */
expectAudience(
  {
    roles: ["ADMIN_PLATFORM"],
    permissions: [],
    representativeProgramParticipants: [],
  },
  "ADMIN",
);

expectAudience(
  {
    roles: [],
    permissions: ["admin.access"],
    representativeProgramParticipants: [],
  },
  "ADMIN",
);

/*
 * If a User is both an administrator and a Program
 * Participant, ADMIN remains the authentication audience.
 * Surface authorization is still enforced separately.
 */
expectAudience(
  {
    roles: ["ADMIN_PLATFORM"],
    permissions: [],
    representativeProgramParticipants: [
      { standing: "ACTIVE" },
    ],
  },
  "ADMIN",
);

/*
 * Program Participants permitted to retain institutional
 * access.
 */
for (
  const standing of [
    "PROVISIONAL",
    "ACTIVE",
    "RESTRICTED",
    "SUSPENDED",
  ]
) {
  expectAudience(
    {
      roles: [],
      permissions: [],
      representativeProgramParticipants: [
        { standing },
      ],
    },
    "REPRESENTATIVE",
  );
}

/*
 * Terminal / ended Program standings may not establish a
 * new representative session.
 */
for (
  const standing of [
    "EXPIRED",
    "WITHDRAWN",
    "REVOKED",
  ]
) {
  expectAudience(
    {
      roles: [],
      permissions: [],
      representativeProgramParticipants: [
        { standing },
      ],
    },
    null,
  );
}

/*
 * Merely having a User record does not establish
 * institutional sign-in eligibility.
 */
expectAudience(
  {
    roles: [],
    permissions: [],
    representativeProgramParticipants: [],
  },
  null,
);

expectAudience(
  {
    roles: [],
    permissions: [],
  },
  null,
);

console.log(
  "AUTH_2A_1_INSTITUTIONAL_SIGN_IN_ELIGIBILITY_OK",
);
