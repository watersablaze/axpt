import assert from "node:assert/strict";
import {
  loadRepresentativeCommercialUtilityPackWithClient as load,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackWithClient";

async function main() {
  const names = [
    "REPRESENTATION", "COMMERCIAL_PARAMETERS",
    "DOCUMENTS", "OPERATING_BOUNDARIES",
  ];
  let participants = [{ id: "participant-a" }];
  const resource = (id: string, module: string, state: string, canView = true) => ({
    id, module, state, canView,
    resourceType: "STRUCTURED_CONTENT",
    resourceId: id + "-source",
    label: id,
    canDownload: false,
    canPresent: false,
    canTransmit: false,
  });
  let pack: any = {
    participantId: "participant-a",
    reference: "TEST-CUP",
    version: 1,
    audience: "REPRESENTATIVE",
    state: "PREPARING",
    releaseState: "PARTIAL",
    modules: names.map(module => ({
      module,
      state: module === "REPRESENTATION" ? "RELEASED" : "READY",
    })),
    resources: [
      resource("visible", "REPRESENTATION", "RELEASED"),
      resource("withheld", "REPRESENTATION", "WITHHELD"),
      resource("denied", "REPRESENTATION", "RELEASED", false),
      resource("historical", "REPRESENTATION", "SUPERSEDED"),
      resource("withdrawn", "REPRESENTATION", "WITHDRAWN"),
      resource("unreleased-module", "DOCUMENTS", "RELEASED"),
    ],
    metadata: { private: "operator-only" },
  };

  const fake = {
    representativeProgramParticipant: {
      async findMany(query: any) {
        assert.deepEqual(query.where, { userId: "user-a" });
        assert.equal(query.take, 2);
        return participants;
      },
    },
    commercialUtilityPack: {
      async findUnique(query: any) {
        assert.deepEqual(query.where, {
          participantId_version: {
            participantId: "participant-a", version: 1,
          },
        });
        assert.deepEqual(query.select.resources.where, {
          state: "RELEASED", canView: true,
        });
        return pack;
      },
    },
  } as unknown as Parameters<typeof load>[0]["client"];

  const read = () => load({ client: fake, userId: " user-a " });
  const result = await read();
  assert.equal(result?.modules.length, 1);
  assert.deepEqual(
    result?.modules[0].resources.map(item => item.id), ["visible"],
  );
  assert.equal(result?.modules[0].resources[0].canDownload, false);
  assert.ok(!JSON.stringify(result).includes("operator-only"));
  console.log("✓ only released module + released resource + view permission passes");

  for (const state of ["SUPERSEDED", "WITHDRAWN"]) {
    pack.state = state;
    assert.equal(await read(), null);
  }
  pack.state = "PREPARING";
  pack.releaseState = "WITHHELD";
  assert.equal(await read(), null);
  pack.releaseState = "PARTIAL";
  console.log("✓ terminal and wholly withheld packages are hidden");

  const original = pack;
  pack = null;
  assert.equal(await read(), null);
  pack = original;
  participants = [];
  assert.equal(await read(), null);
  participants = [{ id: "participant-a" }, { id: "participant-b" }];
  await assert.rejects(read, /PARTICIPANT_CONTRADICTION/);
  participants = [{ id: "participant-a" }];
  console.log("✓ absent records stay absent; duplicate identity fails closed");

  pack.participantId = "participant-b";
  await assert.rejects(read, /IDENTITY_CONTRADICTION/);
  pack.participantId = "participant-a";
  pack.modules.pop();
  await assert.rejects(read, /MODULE_REGISTRY_CONTRADICTION/);
  await assert.rejects(
    () => load({ client: fake, userId: " " }),
    /USER_REQUIRED/,
  );
  console.log("✓ identity and module registry contradictions fail closed");

  console.log("CUP_1H_REPRESENTATIVE_VISIBILITY_OK");
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
