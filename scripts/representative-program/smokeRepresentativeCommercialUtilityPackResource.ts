import assert from "node:assert/strict";
import { projectFrenchWardInstitutionalProfile } from
  "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { projectRepresentativeOperatingBoundaries } from
  "@/domains/instruments/representative-program/operating-boundaries/projectRepresentativeOperatingBoundaries";
import { loadRepresentativeCommercialUtilityPackResourceWithClient as load } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";

async function main() {
  const profile = projectFrenchWardInstitutionalProfile();
  const boundaries = projectRepresentativeOperatingBoundaries();

  const resource = {
    id: "release-a",
    module: "REPRESENTATION",
    resourceType: "STRUCTURED_CONTENT",
    resourceId: profile.reference,
    label: "Profile",
    state: "RELEASED",
    canView: true,
    canDownload: false,
    canPresent: false,
    canTransmit: false,
  };

  const pack = {
    participantId: "participant-a",
    reference: "TEST-CUP",
    version: 1,
    audience: "REPRESENTATIVE",
    state: "PREPARING",
    releaseState: "PARTIAL",
    modules: [
      { module: "REPRESENTATION", state: "RELEASED" },
      { module: "COMMERCIAL_PARAMETERS", state: "WITHHELD" },
      { module: "DOCUMENTS", state: "READY" },
      { module: "OPERATING_BOUNDARIES", state: "RELEASED" },
    ],
    resources: [resource],
  };

  let linked = true;
  const fake = {
    representativeProgramParticipant: {
      async findMany(query: { where: { userId: string } }) {
        return linked && query.where.userId === "user-a"
          ? [{ id: "participant-a" }]
          : [];
      },
    },
    commercialUtilityPack: {
      async findUnique() { return pack; },
    },
  } as unknown as Parameters<typeof load>[0]["client"];

  const read = (userId = "user-a", resourceReleaseId = "release-a") =>
    load({ client: fake, userId, resourceReleaseId });

  const result = await read();
  assert.equal(result?.kind, "INSTITUTIONAL_PROFILE");
  assert.deepEqual(result?.content, profile);
  assert.equal(await read("user-b"), null);
  assert.equal(await read("user-a", "another-release"), null);
  linked = false;
  assert.equal(await read(), null);
  linked = true;
  console.log("✓ canonical content requires the requesting user's released resource");

  resource.state = "WITHHELD";
  assert.equal(await read(), null);
  resource.state = "RELEASED";
  resource.canView = false;
  assert.equal(await read(), null);
  resource.canView = true;
  pack.modules[0].state = "READY";
  assert.equal(await read(), null);
  pack.modules[0].state = "RELEASED";
  console.log("✓ resource withholding, view denial, and unreleased module block content");

  resource.resourceId = "unrecognized-source";
  assert.equal(await read(), null);
  resource.resourceId = profile.reference;
  resource.resourceType = "DOCUMENT";
  assert.equal(await read(), null);
  resource.resourceType = "STRUCTURED_CONTENT";
  console.log("✓ mismatched canonical identity and unsupported type fail closed");

  resource.module = "OPERATING_BOUNDARIES";
  resource.resourceId = boundaries.reference;
  const policy = await read();
  assert.equal(policy?.kind, "OPERATING_BOUNDARIES");
  assert.deepEqual(policy?.content, boundaries);
  assert.equal(await read("user-a", ""), null);
  assert.equal(await read("user-a", "x".repeat(192)), null);
  console.log("✓ operating boundaries resolve through their canonical projection");
  console.log("CUP_1H_REPRESENTATIVE_RESOURCE_OK");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
