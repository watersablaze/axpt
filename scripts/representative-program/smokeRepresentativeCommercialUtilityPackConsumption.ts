import assert from "node:assert/strict";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient as resolve } from
  "../../src/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";

async function main() {
  const at = new Date("2026-10-07T12:00:00.000Z");
  let authorityReads = 0;
  let authorityPresent = false;
  let lastAuthorityKey = "";
  let conditions: Record<string, unknown> = {};

  const appointment = {
    id: "appointment-a",
    participantId: "participant-a",
    instrumentId: "instrument-a",
    instrumentPartyId: "party-a",
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    effectiveAt: new Date("2026-10-01T00:00:00.000Z"),
    expiresAt: null,
    endedAt: null,
    participant: { userId: "user-a", standing: "ACTIVE" },
    instrument: {
      id: "instrument-a",
      reference: "APPT-TEST",
      kind: "REPRESENTATIVE_APPOINTMENT",
      status: "ACTIVE",
    },
    instrumentParty: { id: "party-a", instrumentId: "instrument-a" },
  };

  const resource = {
    id: "resource-a",
    module: "REPRESENTATION",
    resourceType: "STRUCTURED_CONTENT",
    resourceId: "profile-a",
    label: "Profile",
    state: "RELEASED",
    canView: true,
    canDownload: false,
    canPresent: false,
    canTransmit: false,
  };

  const pack = {
    participantId: "participant-a",
    reference: "CUP-TEST",
    version: 1,
    audience: "REPRESENTATIVE",
    state: "PREPARING",
    releaseState: "PARTIAL",
    modules: [
      { module: "REPRESENTATION", state: "RELEASED" },
      { module: "COMMERCIAL_PARAMETERS", state: "WITHHELD" },
      { module: "DOCUMENTS", state: "WITHHELD" },
      { module: "OPERATING_BOUNDARIES", state: "WITHHELD" },
    ],
    resources: [resource],
  };

  const fake = {
    representativeProgramParticipant: {
      findMany: async (query: { where: { userId: string } }) =>
        query.where.userId === "user-a" ? [{ id: "participant-a" }] : [],
    },
    commercialUtilityPack: { findUnique: async () => pack },
    representativeProgramAppointment: {
      findUnique: async () => appointment,
    },
    instrumentAuthority: {
      findMany: async (query: { where: { authorityKey: string } }) => {
        authorityReads += 1;
        lastAuthorityKey = query.where.authorityKey;
        return authorityPresent ? [{
          id: "authority-a",
          instrumentId: "instrument-a",
          authorityKey: lastAuthorityKey,
          title: "Test authority",
          authorityClass: "DELEGATED",
          holderPartyId: "party-a",
          action: "Use approved resources within recorded scope",
          conditions,
          effectiveAt: new Date("2026-10-01T00:00:00.000Z"),
          expiresAt: null,
          revokedAt: null,
          createdByUserId: "operator-a",
        }] : [];
      },
    },
  } as unknown as Parameters<typeof resolve>[0]["client"];

  const input = {
    client: fake,
    userId: "user-a",
    resourceReleaseId: "resource-a",
    appointmentId: "appointment-a",
    context: {},
    at,
  };

  assert.equal((await resolve({ ...input, action: "VIEW" })).allowed, true);
  assert.equal((await resolve({ ...input, action: "DOWNLOAD" })).allowed, false);
  resource.canDownload = true;
  assert.equal((await resolve({ ...input, action: "DOWNLOAD" })).allowed, true);
  assert.equal(authorityReads, 0);
  console.log("✓ view and personal download consume only resource eligibility");

  assert.equal((await resolve({
    ...input, userId: "user-b", action: "VIEW",
  })).allowed, false);

  resource.state = "SUPERSEDED";
  assert.equal((await resolve({ ...input, action: "VIEW" })).allowed, false);
  resource.state = "RELEASED";

  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);
  assert.equal(authorityReads, 0);
  console.log("✓ ownership, current release, and action permission are required");

  resource.canPresent = true;
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);
  authorityPresent = true;
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, true);
  assert.equal(lastAuthorityKey, "ARP.PRESENTATION");

  resource.canTransmit = true;
  assert.equal((await resolve({ ...input, action: "TRANSMIT" })).allowed, true);
  assert.equal(lastAuthorityKey, "ARP.COMMUNICATION");
  console.log("✓ presentation and transmission consume their mapped authority");

  appointment.participant.userId = "other-user";
  const readsBefore = authorityReads;
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);
  assert.equal(authorityReads, readsBefore);
  appointment.participant.userId = "user-a";

  appointment.participant.standing = "SUSPENDED";
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);
  appointment.participant.standing = "ACTIVE";

  conditions = { documentClasses: ["SOURCE_AUTHORITY_PRESENTATION"] };
  assert.equal((await resolve({
    ...input, action: "PRESENT",
    context: { documentClass: "COMMERCIAL_PROFILE" },
  })).allowed, false);
  console.log("✓ foreign appointment, suspended standing, and scope mismatch block use");

  conditions = {
    requiresPriorApproval: true,
    approvalAuthority: "French-Ward Administration",
  };
  const approval = await resolve({
    ...input, action: "PRESENT",
    context: { approvalReference: "UNVERIFIED-REFERENCE" },
  });
  assert.equal(approval.allowed, false);
  assert.equal(approval.reason, "REQUIRED_APPROVAL_NOT_VERIFIED");
  console.log("✓ an opaque approval reference cannot authorize CUP use");

  conditions = { monetaryLimit: "USD 100000" };
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);

  conditions = {};
  authorityPresent = false;
  assert.equal((await resolve({ ...input, action: "PRESENT" })).allowed, false);
  console.log("✓ unresolved monetary limits and removed authority block subsequent evaluation");

  console.log("CUP_AUTHORITY_CONSUMPTION_CONTRACT_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
