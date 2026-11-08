import assert from "node:assert/strict";

import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "../../src/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";

async function main() {
  const activeClient = {
    frenchWardInstitutionalParticipant: {
      async findUnique() {
        return {
          reference:
            "FW-PARTICIPANT-TEST-001",
          userId:
            "user-participant-test",
          displayName:
            "Institutional Participant",
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

  const active =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        activeClient,
      userId:
        "user-participant-test",
    });

  assert(active);
  assert.equal(
    active.reference,
    "FW-PARTICIPANT-TEST-001",
  );
  assert.equal(
    active.capacityClass,
    "OPERATIONS",
  );
  assert.equal(
    active.active,
    true,
  );

  const endedClient = {
    frenchWardInstitutionalParticipant: {
      async findUnique() {
        return {
          ...active,
          status:
            "ACTIVE",
          endedAt:
            new Date(
              "2026-11-08T01:00:00Z",
            ),
        };
      },
    },
  } as any;

  const ended =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        endedClient,
      userId:
        "user-participant-test",
    });

  assert(ended);
  assert.equal(
    ended.active,
    false,
  );

  const missingClient = {
    frenchWardInstitutionalParticipant: {
      async findUnique() {
        return null;
      },
    },
  } as any;

  const missing =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        missingClient,
      userId:
        "user-participant-test",
    });

  assert.equal(
    missing,
    null,
  );

  const blank =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        activeClient,
      userId:
        "   ",
    });

  assert.equal(
    blank,
    null,
  );

  console.log(
    "✓ active participant projects as active",
  );
  console.log(
    "✓ ended participant fails active projection",
  );
  console.log(
    "✓ missing participant projects null",
  );
  console.log(
    "✓ blank identity fails closed",
  );
  console.log(
    "✓ participation grants no authority by itself",
  );
  console.log(
    "✓ FW-FOUNDING-INVITE-1B.1 CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
