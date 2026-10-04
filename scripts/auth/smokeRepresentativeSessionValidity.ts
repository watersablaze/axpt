import assert from "node:assert/strict";

import {
  resolveRepresentativeSessionValidity,
} from "../../src/domains/auth/resolveRepresentativeSessionValidity";

function rep(
  standing: string,
) {
  return {
    sessionTier:
      "representative",

    roles:
      [],

    permissions:
      [],

    representativeProgramParticipants: [
      {
        standing,
      },
    ],
  };
}

async function main() {
  for (
    const standing
    of [
      "PROVISIONAL",
      "ACTIVE",
      "RESTRICTED",
      "SUSPENDED",
    ]
  ) {
    assert.equal(
      resolveRepresentativeSessionValidity(
        rep(
          standing,
        ),
      ),
      true,
      `${standing} representative session should remain valid`,
    );
  }

  for (
    const standing
    of [
      "EXPIRED",
      "WITHDRAWN",
      "REVOKED",
    ]
  ) {
    assert.equal(
      resolveRepresentativeSessionValidity(
        rep(
          standing,
        ),
      ),
      false,
      `${standing} representative session should be rejected`,
    );
  }

  assert.equal(
    resolveRepresentativeSessionValidity({
      sessionTier:
        "representative",

      roles:
        [],

      permissions:
        [],

      representativeProgramParticipants:
        [],
    }),
    false,
    "representative session without Program participant must fail",
  );

  assert.equal(
    resolveRepresentativeSessionValidity({
      sessionTier:
        "operations",

      roles:
        [],

      permissions:
        [],

      representativeProgramParticipants:
        [],
    }),
    true,
    "non-representative session behavior must remain unchanged",
  );

  assert.equal(
    resolveRepresentativeSessionValidity({
      sessionTier:
        "representative",

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions:
        [],

      representativeProgramParticipants: [
        {
          standing:
            "REVOKED",
        },
      ],
    }),
    false,
    "representative session must not survive on ADMIN eligibility",
  );

  assert.equal(
    resolveRepresentativeSessionValidity({
      sessionTier:
        "representative",

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions:
        [],

      representativeProgramParticipants: [
        {
          standing:
            "ACTIVE",
        },
      ],
    }),
    false,
    "representative session must retain REPRESENTATIVE audience, not ADMIN priority",
  );

  console.log(
    "AUTH_2B_2_REPRESENTATIVE_SESSION_AUDIENCE_LOCK_OK",
  );
}

main().catch(
  (error) => {
    console.error(
      error,
    );

    process.exit(
      1,
    );
  },
);
