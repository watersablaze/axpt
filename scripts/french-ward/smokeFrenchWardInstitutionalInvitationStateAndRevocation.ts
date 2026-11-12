import assert from "node:assert/strict";

import {
  hashFrenchWardInstitutionalInvitationCredential,
} from "../../src/domains/institutions/french-ward/participants/invitations/institutionalInvitationCredential";

import {
  loadFrenchWardInstitutionalInvitationStateWithClient,
} from "../../src/domains/institutions/french-ward/participants/invitations/loadFrenchWardInstitutionalInvitationStateWithClient";

import {
  revokeFrenchWardInstitutionalInvitationWithClient,
} from "../../src/domains/institutions/french-ward/participants/invitations/revokeFrenchWardInstitutionalInvitationWithClient";

const now =
  new Date(
    "2026-11-08T12:00:00.000Z",
  );

const rawCredential =
  "state-contract-credential";

const credentialHash =
  hashFrenchWardInstitutionalInvitationCredential(
    rawCredential,
  );

function createHarness() {
  const users =
    [
      {
        id:
          "admin-1",

        isAdmin:
          true,
      },

      {
        id:
          "participant-1",

        isAdmin:
          false,
      },
    ];

  const invitations =
    [
      {
        id:
          "invitation-1",

        reference:
          "FW-INST-INV-STATE-001",

        recipientDisplayName:
          "Founding Person",

        participantReference:
          "FW-PART-STATE-001",

        institutionalTitle:
          "Chief Strategic Officer",

        secondaryTitle:
          null,

        capacityClass:
          "STRATEGIC",

        recognitionBasis:
          "French-Ward institutional founding recognition",

        provenanceReference:
          "FW-PROFILE-2026-001/V3",

        credentialHash,

        expiresAt:
          new Date(
            now.getTime() +
              86_400_000,
          ),

        issuedAt:
          new Date(
            now.getTime() -
              60_000,
          ),

        acceptedByUserId:
          null as string | null,

        acceptedAt:
          null as Date | null,

        revokedByUserId:
          null as string | null,

        revokedAt:
          null,

        revocationReason:
          null,
      },
    ];

  const participants =
    [
      {
        id:
          "participant-record-1",

        userId:
          "participant-1",

        reference:
          "FW-PART-STATE-001",

        status:
          "ACTIVE",

        endedAt:
          null,
      },
    ];

  const events:
    any[] = [];

  const tx: any = {
    async $queryRaw(
      _strings: TemplateStringsArray,
      ..._values: any[]
    ) {
      return [];
    },

    user: {
      async findUnique({
        where,
      }: any) {
        return (
          users.find(
            user =>
              user.id ===
              where.id,
          ) ??
          null
        );
      },
    },

    frenchWardInstitutionalInvitation: {
      async findUnique({
        where,
      }: any) {
        if (
          where.credentialHash
        ) {
          return (
            invitations.find(
              invitation =>
                invitation
                  .credentialHash ===
                where.credentialHash,
            ) ??
            null
          );
        }

        if (
          where.reference
        ) {
          return (
            invitations.find(
              invitation =>
                invitation
                  .reference ===
                where.reference,
            ) ??
            null
          );
        }

        return null;
      },

      async update({
        where,
        data,
      }: any) {
        const invitation =
          invitations.find(
            row =>
              row.id ===
              where.id,
          );

        if (!invitation) {
          throw new Error(
            "invitation missing",
          );
        }

        Object.assign(
          invitation,
          data,
        );

        return invitation;
      },
    },

    domainEvent: {
      async create({
        data,
      }: any) {
        events.push(
          data,
        );

        return data;
      },
    },
  };

  const client: any = {
    ...tx,

    async $transaction(
      operation: (
        inner: typeof tx,
      ) => Promise<any>,
    ) {
      return operation(
        tx,
      );
    },
  };

  return {
    client,
    invitations,
    participants,
    events,
  };
}

async function main() {
  const pending =
    createHarness();

  const pendingView =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        pending.client,

      credential:
        rawCredential,

      now,
    });

  assert.ok(
    pendingView,
  );

  assert.equal(
    pendingView.state,
    "PENDING",
  );

  assert.equal(
    (pendingView as any)
      .credentialHash,
    undefined,
  );

  const missing =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        pending.client,

      credential:
        "incorrect-credential",

      now,
    });

  assert.equal(
    missing,
    null,
  );

  const accepted =
    createHarness();

  accepted.invitations[0]
    .acceptedAt =
      new Date(
        now.getTime() -
          1,
      );

  accepted.invitations[0]
    .acceptedByUserId =
      "participant-1";

  const acceptedView =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        accepted.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    acceptedView?.state,
    "ACCEPTED",
  );

  const expired =
    createHarness();

  expired.invitations[0]
    .expiresAt =
      new Date(
        now.getTime() -
          1,
      );

  const expiredView =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        expired.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    expiredView?.state,
    "EXPIRED",
  );

  /*
   * Pending invitation revocation.
   */
  const revoked =
    createHarness();

  const revokedResult =
    await revokeFrenchWardInstitutionalInvitationWithClient({
      client:
        revoked.client,

      reference:
        "FW-INST-INV-STATE-001",

      revokedByUserId:
        "admin-1",

      reason:
        "Credential superseded",

      now,
    });

  assert.equal(
    revokedResult
      .alreadyRevoked,
    false,
  );

  assert.equal(
    revoked.invitations[0]
      .revokedByUserId,
    "admin-1",
  );

  assert.equal(
    revoked.invitations[0]
      .revocationReason,
    "Credential superseded",
  );

  assert.equal(
    revoked.events.length,
    1,
  );

  const revokedView =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        revoked.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    revokedView?.state,
    "REVOKED",
  );

  /*
   * Revocation replay is idempotent.
   */
  const replay =
    await revokeFrenchWardInstitutionalInvitationWithClient({
      client:
        revoked.client,

      reference:
        "FW-INST-INV-STATE-001",

      revokedByUserId:
        "admin-1",

      reason:
        "Credential superseded",

      now:
        new Date(
          now.getTime() +
            1,
        ),
    });

  assert.equal(
    replay.alreadyRevoked,
    true,
  );

  assert.equal(
    revoked.events.length,
    1,
  );

  /*
   * Non-admin cannot revoke.
   */
  const unauthorized =
    createHarness();

  await assert.rejects(
    revokeFrenchWardInstitutionalInvitationWithClient({
      client:
        unauthorized.client,

      reference:
        "FW-INST-INV-STATE-001",

      revokedByUserId:
        "participant-1",

      reason:
        "Unauthorized attempt",

      now,
    }),
    /REVOKER_NOT_AUTHORIZED/,
  );

  assert.equal(
    unauthorized.invitations[0]
      .revokedAt,
    null,
  );

  /*
   * Revoking an accepted invitation does not alter participant standing.
   */
  const acceptedRevocation =
    createHarness();

  acceptedRevocation
    .invitations[0]
    .acceptedAt =
      new Date(
        now.getTime() -
          10,
      );

  acceptedRevocation
    .invitations[0]
    .acceptedByUserId =
      "participant-1";

  const participantBefore =
    JSON.stringify(
      acceptedRevocation
        .participants,
    );

  await revokeFrenchWardInstitutionalInvitationWithClient({
    client:
      acceptedRevocation.client,

    reference:
      "FW-INST-INV-STATE-001",

    revokedByUserId:
      "admin-1",

    reason:
      "Invitation record administratively revoked",

    now,
  });

  const participantAfter =
    JSON.stringify(
      acceptedRevocation
        .participants,
    );

  assert.equal(
    participantAfter,
    participantBefore,
  );

  const acceptedRevokedView =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        acceptedRevocation.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    acceptedRevokedView?.state,
    "REVOKED",
  );

  console.log(
    "✓ pending invitation resolves as PENDING",
  );

  console.log(
    "✓ accepted invitation resolves as ACCEPTED",
  );

  console.log(
    "✓ expired invitation resolves as EXPIRED",
  );

  console.log(
    "✓ revoked invitation resolves as REVOKED",
  );

  console.log(
    "✓ invalid credential projects as null",
  );

  console.log(
    "✓ credential hash never enters public projection",
  );

  console.log(
    "✓ administrative revocation is attributable",
  );

  console.log(
    "✓ revocation replay is idempotent",
  );

  console.log(
    "✓ non-admin revocation denied",
  );

  console.log(
    "✓ accepted invitation revocation does not terminate participant",
  );

  console.log(
    "✓ FW-FOUNDING-INVITE-1B.4E CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
