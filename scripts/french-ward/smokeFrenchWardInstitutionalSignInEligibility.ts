import assert from "node:assert/strict";

import {
  resolveInstitutionalSignInEligibility,
} from "../../src/domains/auth/resolveInstitutionalSignInEligibility";

import {
  resolveFrenchWardInstitutionalSessionValidityWithClient,
} from "../../src/domains/auth/resolveFrenchWardInstitutionalSessionValidityWithClient";

async function main() {
  const participant = {
    status: "ACTIVE",
    endedAt: null,
  };

  const institutional =
    resolveInstitutionalSignInEligibility({
      frenchWardInstitutionalParticipant:
        participant,
    });

  assert.equal(
    institutional.eligible,
    true,
  );

  assert.equal(
    institutional.audience,
    "FRENCH_WARD_INSTITUTIONAL",
  );

  const governing =
    resolveInstitutionalSignInEligibility({
      frenchWardGoverningStanding: {
        status: "ACTIVE",
        endedAt: null,
      },
      frenchWardInstitutionalParticipant:
        participant,
    });

  assert.equal(
    governing.eligible,
    true,
  );

  assert.equal(
    governing.audience,
    "FRENCH_WARD_GOVERNING",
  );

  const ended =
    resolveInstitutionalSignInEligibility({
      frenchWardInstitutionalParticipant: {
        status: "ACTIVE",
        endedAt:
          new Date(
            "2026-11-08T01:00:00Z",
          ),
      },
    });

  assert.equal(
    ended.eligible,
    false,
  );

  const inactive =
    resolveInstitutionalSignInEligibility({
      frenchWardInstitutionalParticipant: {
        status: "ENDED",
        endedAt: null,
      },
    });

  assert.equal(
    inactive.eligible,
    false,
  );

  const activeClient = {
    frenchWardInstitutionalParticipant: {
      async findUnique() {
        return {
          reference:
            "FW-PARTICIPANT-TEST-001",
          userId:
            "user-test",
          displayName:
            "Participant",
          institutionalTitle:
            "Chief Logistics Officer",
          secondaryTitle:
            null,
          capacityClass:
            "OPERATIONS",
          recognitionBasis:
            "French-Ward institutional record",
          provenanceReference:
            null,
          status:
            "ACTIVE",
          recognizedAt:
            new Date(
              "2026-11-08T00:00:00Z",
            ),
          endedAt:
            null,
        };
      },
    },
  } as any;

  assert.equal(
    await resolveFrenchWardInstitutionalSessionValidityWithClient({
      client:
        activeClient,
      sessionTier:
        "french-ward-institutional",
      userId:
        "user-test",
    }),
    true,
  );

  const endedClient = {
    frenchWardInstitutionalParticipant: {
      async findUnique() {
        return {
          reference:
            "FW-PARTICIPANT-TEST-001",
          userId:
            "user-test",
          displayName:
            "Participant",
          institutionalTitle:
            "Chief Logistics Officer",
          secondaryTitle:
            null,
          capacityClass:
            "OPERATIONS",
          recognitionBasis:
            "French-Ward institutional record",
          provenanceReference:
            null,
          status:
            "ACTIVE",
          recognizedAt:
            new Date(
              "2026-11-08T00:00:00Z",
            ),
          endedAt:
            new Date(
              "2026-11-08T01:00:00Z",
            ),
        };
      },
    },
  } as any;

  assert.equal(
    await resolveFrenchWardInstitutionalSessionValidityWithClient({
      client:
        endedClient,
      sessionTier:
        "french-ward-institutional",
      userId:
        "user-test",
    }),
    false,
  );

  assert.equal(
    await resolveFrenchWardInstitutionalSessionValidityWithClient({
      client:
        endedClient,
      sessionTier:
        "representative",
      userId:
        "user-test",
    }),
    true,
  );

  console.log(
    "✓ active participant is institutional sign-in eligible",
  );
  console.log(
    "✓ governing audience retains priority",
  );
  console.log(
    "✓ ended participant denied",
  );
  console.log(
    "✓ inactive participant denied",
  );
  console.log(
    "✓ institutional session continuously revalidated",
  );
  console.log(
    "✓ ended recognition invalidates institutional session",
  );
  console.log(
    "✓ unrelated session tiers unaffected",
  );
  console.log(
    "✓ FW-FOUNDING-INVITE-1B.2A CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
