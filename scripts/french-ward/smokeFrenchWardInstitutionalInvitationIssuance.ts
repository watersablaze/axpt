import assert from "node:assert/strict";

import {
  issueFrenchWardInstitutionalInvitationWithClient,
} from "../../src/domains/institutions/french-ward/participants/invitations/issueFrenchWardInstitutionalInvitationWithClient";

type UserRow = {
  id: string;
  isAdmin: boolean;
};

type InvitationRow = {
  id: string;
  reference: string;

  recipientEmail: string;
  recipientDisplayName: string;

  participantReference: string;

  institutionalTitle: string;
  secondaryTitle: string | null;

  capacityClass:
    | "STRATEGIC"
    | "OPERATIONS"
    | "FIDUCIARY";

  recognitionBasis: string;
  provenanceReference: string | null;

  credentialHash: string;

  expiresAt: Date;

  issuedByUserId: string;
  issuedAt: Date;

  acceptedAt: Date | null;
  revokedAt: Date | null;
};

type DomainEventRow = {
  streamType: string;
  streamId: string;
  eventType: string;
  payload: any;
  metadata: any;
  occurredAt: Date;
};

let users: UserRow[] = [
  {
    id: "admin-1",
    isAdmin: true,
  },
  {
    id: "participant-issuer",
    isAdmin: false,
  },
];

let invitations:
  InvitationRow[] = [];

let events:
  DomainEventRow[] = [];

const tx = {
  user: {
    async findUnique({
      where,
    }: any) {
      return (
        users.find(
          user =>
            user.id === where.id,
        ) ?? null
      );
    },
  },

  frenchWardInstitutionalInvitation: {
    async findUnique({
      where,
    }: any) {
      return (
        invitations.find(
          invitation =>
            invitation.reference ===
            where.reference,
        ) ?? null
      );
    },

    async findFirst({
      where,
    }: any) {
      return (
        invitations.find(
          invitation =>
            invitation.participantReference ===
              where.participantReference &&
            invitation.acceptedAt === null &&
            invitation.revokedAt === null &&
            invitation.expiresAt >
              where.expiresAt.gt,
        ) ?? null
      );
    },

    async create({
      data,
    }: any) {
      const invitation:
        InvitationRow = {
        id:
          `invitation-${invitations.length + 1}`,

        ...data,

        acceptedAt:
          null,

        revokedAt:
          null,
      };

      invitations.push(
        invitation,
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

const client = {
  async $transaction(
    operation: (
      inner: typeof tx,
    ) => Promise<any>,
  ) {
    /*
     * Sufficient offline contract harness.
     * Real PostgreSQL atomicity is qualified later in rehearsal.
     */
    return operation(tx);
  },
} as any;

const now =
  new Date(
    "2026-11-08T08:00:00.000Z",
  );

const expiresAt =
  new Date(
    "2026-11-15T08:00:00.000Z",
  );

const baseInput = {
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
    "OPERATIONS" as const,

  recognitionBasis:
    "French-Ward institutional founding recognition",

  provenanceReference:
    "FW-PROFILE-2026-001/V3",

  expiresAt,

  issuedByUserId:
    "admin-1",

  now,
};

async function main() {
  const result =
    await issueFrenchWardInstitutionalInvitationWithClient({
      client,
      input:
        baseInput,
    });

  assert.equal(
    invitations.length,
    1,
  );

  assert.equal(
    events.length,
    1,
  );

  assert.equal(
    result.invitation.reference,
    baseInput.reference,
  );

  assert.equal(
    result.invitation.recipientEmail,
    "founding.person@example.com",
  );

  assert.equal(
    result.invitation.participantReference,
    baseInput.participantReference,
  );

  assert.equal(
    result.invitation.capacityClass,
    "OPERATIONS",
  );

  assert.ok(
    result.credential.length >
      32,
  );

  assert.match(
    invitations[0]
      .credentialHash,
    /^[a-f0-9]{64}$/,
  );

  assert.notEqual(
    invitations[0]
      .credentialHash,
    result.credential,
  );

  assert.equal(
    events[0].eventType,
    "FRENCH_WARD_INSTITUTIONAL_INVITATION_ISSUED",
  );

  assert.equal(
    events[0].metadata.actorUserId,
    "admin-1",
  );

  assert.equal(
    JSON.stringify(
      events[0],
    ).includes(
      result.credential,
    ),
    false,
  );

  await assert.rejects(
    issueFrenchWardInstitutionalInvitationWithClient({
      client,
      input:
        baseInput,
    }),
    /REFERENCE_ALREADY_ISSUED/,
  );

  await assert.rejects(
    issueFrenchWardInstitutionalInvitationWithClient({
      client,
      input: {
        ...baseInput,

        reference:
          "FW-INST-INV-TEST-002",
      },
    }),
    /PENDING_FOR_PARTICIPANT/,
  );

  await assert.rejects(
    issueFrenchWardInstitutionalInvitationWithClient({
      client,
      input: {
        ...baseInput,

        reference:
          "FW-INST-INV-TEST-003",

        participantReference:
          "FW-PART-TEST-002",

        issuedByUserId:
          "participant-issuer",
      },
    }),
    /ISSUER_NOT_AUTHORIZED/,
  );

  assert.equal(
    invitations.length,
    1,
  );

  assert.equal(
    events.length,
    1,
  );

  assert.equal(
    (invitations[0] as any)
      .acceptedByUserId,
    undefined,
  );

  console.log(
    "✓ administrative issuer required",
  );

  console.log(
    "✓ recipient email canonicalized",
  );

  console.log(
    "✓ invitation created exactly once",
  );

  console.log(
    "✓ raw credential returned but never persisted",
  );

  console.log(
    "✓ attributable issuance event recorded",
  );

  console.log(
    "✓ raw credential absent from audit event",
  );

  console.log(
    "✓ duplicate reference fails closed",
  );

  console.log(
    "✓ second live invitation for same participant fails closed",
  );

  console.log(
    "✓ issuance creates no User or participant recognition",
  );

  console.log(
    "✓ FW-FOUNDING-INVITE-1B.4C CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
