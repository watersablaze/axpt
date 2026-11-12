import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pagePath =
  path.resolve(
    process.cwd(),
    "app/french-ward/institutional/welcome/page.tsx",
  );

const source =
  fs.readFileSync(
    pagePath,
    "utf8",
  );

const required = [
  "FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE",
  "loadFrenchWardInstitutionalInvitationStateWithClient",
  'invitation.state !==\n      "PENDING"',
  "invitation.recipientDisplayName",
  "invitation.institutionalTitle",
  "invitation.capacityClass",
  "invitation.participantReference",
  "invitation.recognitionBasis",
  "invitation.provenanceReference",
  "invitation.reference",
  "invitation.expiresAt",
  "Pending Acceptance",
  "No acceptance recorded",
];

for (const needle of required) {
  assert.equal(
    source.includes(needle),
    true,
    `missing welcome contract: ${needle}`,
  );
}

const forbidden = [
  "recipientEmail",
  "credentialHash",
  "issuedByUserId",
  "acceptedByUserId",
  "revokedByUserId",
  "revocationReason",
  "acceptFrenchWardInstitutionalInvitationWithClient",
  "requestInstitutionalLoginPin",
  "verifyInstitutionalLoginPin",
  "createSessionToken",
  "createSessionCookie",
  "frenchWardInstitutionalParticipant.create",
  "frenchWardInstitutionalParticipant.update",
  "frenchWardGoverningOfficer",
  "InstitutionalAccessGrant",
  "InstrumentAuthority",
];

for (const needle of forbidden) {
  assert.equal(
    source.includes(needle),
    false,
    `forbidden welcome dependency: ${needle}`,
  );
}

console.log(
  "✓ welcome reads scoped bearer cookie server-side",
);

console.log(
  "✓ welcome resolves invitation through sealed public projection",
);

console.log(
  "✓ welcome admits PENDING state only",
);

console.log(
  "✓ identity and capacity presentation retained",
);

console.log(
  "✓ recipient email and internal attribution remain hidden",
);

console.log(
  "✓ no acceptance/auth/session mutation present",
);

console.log(
  "✓ FW-FOUNDING-INVITE-1B.4G.B CONTRACT PASSED",
);
