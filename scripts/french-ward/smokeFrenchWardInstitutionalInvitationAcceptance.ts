import assert from "node:assert/strict";

import {
  hashFrenchWardInstitutionalInvitationCredential,
} from "../../src/domains/institutions/french-ward/participants/invitations/institutionalInvitationCredential";

import {
  acceptFrenchWardInstitutionalInvitationWithClient,
} from "../../src/domains/institutions/french-ward/participants/invitations/acceptFrenchWardInstitutionalInvitationWithClient";

const now =
  new Date(
    "2026-11-08T10:00:00.000Z",
  );

const rawCredential =
  "test-founding-invitation-credential-001";

const credentialHash =
  hashFrenchWardInstitutionalInvitationCredential(
    rawCredential,
  );

function createHarness() {
  const users: any[] = [];

  const invitations: any[] = [
    {
      id:
        "invitation-1",

      reference:
        "FW-INST-INV-TEST-001",

      recipientEmail:
        "Founding.Person@Example.com",

      recipientDisplayName:
        "Founding Person",

      participantReference:
        "FW-PART-TEST-001",

      institutionalTitle:
        "Chief Logistics Officer",

      secondaryTitle:
        null,

      capacityClass:
        "OPERATIONS",

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

      issuedByUserId:
        "admin-1",

      issuedAt:
        new Date(
          now.getTime() -
            60_000,
        ),

      acceptedByUserId:
        null,

      acceptedAt:
        null,

      revokedAt:
        null,
    },
  ];

  const participants:
    any[] = [];

  const events:
    any[] = [];

  let userSequence =
    0;

  let participantSequence =
    0;

  const tx: any = {
    async $queryRaw(
      _strings: TemplateStringsArray,
      ..._values: any[]
    ) {
      return [];
    },

    user: {
      async findMany({
        where,
      }: any) {
        const expected =
          where.email.equals
            .trim()
            .toLowerCase();

        return users
          .filter(
            user =>
              user.email
                .toLowerCase() ===
              expected,
          )
          .slice(
            0,
            2,
          );
      },

      async findUnique({
        where,
      }: any) {
        if (
          where.username
        ) {
          return (
            users.find(
              user =>
                user.username ===
                where.username,
            ) ??
            null
          );
        }

        if (where.id) {
          return (
            users.find(
              user =>
                user.id ===
                where.id,
            ) ??
            null
          );
        }

        return null;
      },

      async create({
        data,
      }: any) {
        userSequence +=
          1;

        const user = {
          id:
            `user-${userSequence}`,

          username:
            data.username,

          email:
            data.email,

          name:
            data.name ??
            null,

          displayName:
            data.displayName ??
            null,

          isAdmin:
            data.isAdmin ??
            false,

          tier:
            data.tier ??
            null,

          createdAt:
            now,
        };

        users.push(
          user,
        );

        return user;
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

    frenchWardInstitutionalParticipant: {
      async findUnique({
        where,
      }: any) {
        if (
          where.reference
        ) {
          return (
            participants.find(
              participant =>
                participant.reference ===
                where.reference,
            ) ??
            null
          );
        }

        if (where.userId) {
          return (
            participants.find(
              participant =>
                participant.userId ===
                where.userId,
            ) ??
            null
          );
        }

        return null;
      },

      async create({
        data,
      }: any) {
        participantSequence +=
          1;

        const participant = {
          id:
            `participant-${participantSequence}`,

          ...data,
        };

        participants.push(
          participant,
        );

        return participant;
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
    users,
    invitations,
    participants,
    events,
  };
}

async function main() {
  /*
   * New recipient identity.
   */
  const first =
    createHarness();

  const accepted =
    await acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        first.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    accepted.userCreated,
    true,
  );

  assert.equal(
    first.users.length,
    1,
  );

  assert.equal(
    first.participants.length,
    1,
  );

  assert.equal(
    first.events.length,
    1,
  );

  assert.equal(
    accepted.user.email,
    "founding.person@example.com",
  );

  assert.equal(
    accepted.user.isAdmin,
    false,
  );

  assert.equal(
    accepted.user.tier,
    null,
  );

  assert.equal(
    accepted.participant.reference,
    "FW-PART-TEST-001",
  );

  assert.equal(
    accepted.participant.status,
    "ACTIVE",
  );

  assert.equal(
    accepted.participant.createdByUserId,
    "admin-1",
  );

  assert.equal(
    first.invitations[0]
      .acceptedByUserId,
    accepted.user.id,
  );

  assert.equal(
    first.invitations[0]
      .acceptedAt
      .getTime(),
    now.getTime(),
  );

  assert.equal(
    first.events[0]
      .eventType,
    "FRENCH_WARD_INSTITUTIONAL_INVITATION_ACCEPTED",
  );

  assert.equal(
    first.events[0]
      .metadata.actorUserId,
    accepted.user.id,
  );

  assert.equal(
    JSON.stringify(
      first.events[0],
    ).includes(
      rawCredential,
    ),
    false,
  );

  /*
   * One-time acceptance.
   */
  await assert.rejects(
    acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        first.client,

      credential:
        rawCredential,

      now:
        new Date(
          now.getTime() +
            1,
        ),
    }),
    /ALREADY_ACCEPTED/,
  );

  assert.equal(
    first.participants.length,
    1,
  );

  /*
   * Existing canonical AXPT User is reused without rewriting identity.
   */
  const existing =
    createHarness();

  existing.users.push({
    id:
      "existing-user",

    username:
      "existing-canonical-user",

    email:
      "FOUNDING.PERSON@example.com",

    name:
      "Canonical Existing Name",

    displayName:
      "Canonical Existing Display",

    isAdmin:
      false,

    tier:
      "existing-tier",

    createdAt:
      new Date(
        now.getTime() -
          100_000,
      ),
  });

  const reused =
    await acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        existing.client,

      credential:
        rawCredential,

      now,
    });

  assert.equal(
    reused.userCreated,
    false,
  );

  assert.equal(
    reused.user.id,
    "existing-user",
  );

  assert.equal(
    reused.user.displayName,
    "Canonical Existing Display",
  );

  assert.equal(
    reused.user.tier,
    "existing-tier",
  );

  assert.equal(
    reused.participant.displayName,
    "Founding Person",
  );

  assert.equal(
    existing.users.length,
    1,
  );

  /*
   * Case-variant duplicate User identity fails closed.
   */
  const duplicate =
    createHarness();

  duplicate.users.push(
    {
      id:
        "duplicate-1",

      username:
        "duplicate-one",

      email:
        "founding.person@example.com",

      displayName:
        "One",

      isAdmin:
        false,

      tier:
        null,

      createdAt:
        now,
    },

    {
      id:
        "duplicate-2",

      username:
        "duplicate-two",

      email:
        "FOUNDING.PERSON@example.com",

      displayName:
        "Two",

      isAdmin:
        false,

      tier:
        null,

      createdAt:
        now,
    },
  );

  await assert.rejects(
    acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        duplicate.client,

      credential:
        rawCredential,

      now,
    }),
    /USER_EMAIL_CONTRADICTION/,
  );

  /*
   * Existing participant identity prevents silent reassignment.
   */
  const conflict =
    createHarness();

  conflict.users.push({
    id:
      "existing-user",

    username:
      "existing-user",

    email:
      "founding.person@example.com",

    displayName:
      "Existing",

    isAdmin:
      false,

    tier:
      null,

    createdAt:
      now,
  });

  conflict.participants.push({
    id:
      "existing-participant",

    userId:
      "different-user",

    reference:
      "FW-PART-TEST-001",
  });

  await assert.rejects(
    acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        conflict.client,

      credential:
        rawCredential,

      now,
    }),
    /PARTICIPANT_ALREADY_RECOGNIZED/,
  );

  /*
   * Revoked invitation cannot establish identity or recognition.
   */
  const revoked =
    createHarness();

  revoked.invitations[0]
    .revokedAt =
      new Date(
        now.getTime() -
          1,
      );

  await assert.rejects(
    acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        revoked.client,

      credential:
        rawCredential,

      now,
    }),
    /INVITATION_REVOKED/,
  );

  assert.equal(
    revoked.users.length,
    0,
  );

  assert.equal(
    revoked.participants.length,
    0,
  );

  /*
   * Expired invitation cannot establish identity or recognition.
   */
  const expired =
    createHarness();

  expired.invitations[0]
    .expiresAt =
      new Date(
        now.getTime() -
          1,
      );

  await assert.rejects(
    acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        expired.client,

      credential:
        rawCredential,

      now,
    }),
    /INVITATION_EXPIRED/,
  );

  assert.equal(
    expired.users.length,
    0,
  );

  assert.equal(
    expired.participants.length,
    0,
  );

  console.log(
    "✓ credential acceptance creates canonical User when absent",
  );

  console.log(
    "✓ existing canonical User reused without rewrite",
  );

  console.log(
    "✓ exact institutional participant created from invitation",
  );

  console.log(
    "✓ invitation acceptance recorded once",
  );

  console.log(
    "✓ recognition attributed to invitation issuer",
  );

  console.log(
    "✓ acceptance event attributed to accepted User",
  );

  console.log(
    "✓ raw bearer credential absent from event history",
  );

  console.log(
    "✓ repeat acceptance fails closed",
  );

  console.log(
    "✓ duplicate case-variant User identity fails closed",
  );

  console.log(
    "✓ participant identity conflict fails closed",
  );

  console.log(
    "✓ revoked invitation creates nothing",
  );

  console.log(
    "✓ expired invitation creates nothing",
  );

  console.log(
    "✓ no governing, commercial, role or resource authority implied",
  );

  console.log(
    "✓ FW-FOUNDING-INVITE-1B.4D CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
