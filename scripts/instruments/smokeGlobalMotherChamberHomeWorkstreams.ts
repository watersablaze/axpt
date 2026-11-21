import assert from "node:assert/strict";
import {
  loadGlobalMotherChamberHomeWorkstreamsWithClient,
  type ChamberHomeWorkstreamClient,
} from "../../src/domains/instruments/global-mother/loadGlobalMotherChamberHomeWorkstreamsWithClient";

const timestamp = new Date("2026-10-28T12:00:00.000Z");
let assertions = 0;
function check(condition: unknown, message: string) {
  assertions++;
  assert.ok(condition, message);
}

function binding(overrides: Record<string, unknown> = {}) {
  const room = {
    id: "room-1",
    clientRoomId: "gm-kenya-rcf-001-chamber-v2",
    roomClass: "GENERAL_OPERATIONS",
    conversation: { title: "Global Mother · Chamber V2", status: "ACTIVE" },
    links: [],
  };
  return { standing: "BOUND", operationalRoom: room, ...overrides };
}

async function read(result: unknown) {
  const client = {
    globalMotherChamberRoomBinding: {
      findUnique: async () => result,
    },
  } as unknown as ChamberHomeWorkstreamClient;
  return loadGlobalMotherChamberHomeWorkstreamsWithClient(client);
}

async function main() {
  const missing = await read(null);
  check(missing.standing === "NOT_ESTABLISHED", "missing binding must not establish home");
  check(missing.workstreams.length === 0, "missing binding reveals no links");
  check(!missing.operationallyUsable, "missing binding is not operational");

  const empty = await read(binding());
  check(empty.standing === "ESTABLISHED", "exact bound topology can be read internally");
  check(empty.workstreams.length === 0, "empty home is valid");
  check(!empty.operationallyUsable, "home read never enables operations");

  for (const variation of [
    { standing: "REVOKED" },
    { standing: "DRAFT" },
    { operationalRoom: null },
    { operationalRoom: { ...binding().operationalRoom, clientRoomId: "wrong" } },
    { operationalRoom: { ...binding().operationalRoom, roomClass: "TRANSACTION" } },
    { operationalRoom: { ...binding().operationalRoom, conversation: { title: "wrong", status: "ACTIVE" } } },
    { operationalRoom: { ...binding().operationalRoom, conversation: { title: "Global Mother · Chamber V2", status: "CLOSED" } } },
  ]) {
    const result = await read(binding(variation));
    check(result.standing === "REVIEW_REQUIRED", "invalid binding fails closed");
    check(result.workstreams.length === 0, "invalid binding leaks no links");
    check(!result.operationallyUsable, "invalid binding is not operational");
  }

  const links = [
    { id: "link-1", roomId: "room-1", targetType: "TRANSACTION_DOSSIER", targetSubtype: "COMMERCIAL", targetId: "dossier-1", linkedByUserId: "operator-1", linkedAt: timestamp },
    { id: "link-2", roomId: "room-1", targetType: "CASE", targetSubtype: "COORDINATION", targetId: "case-1", linkedByUserId: "operator-1", linkedAt: timestamp },
    { id: "link-3", roomId: "room-1", targetType: "OPPORTUNITY", targetSubtype: "GENERAL", targetId: "opportunity-1", linkedByUserId: "operator-1", linkedAt: timestamp },
    { id: "link-4", roomId: "room-1", targetType: "TREASURY_GATEWAY_AGGREGATE", targetSubtype: "X", targetId: "treasury-1", linkedByUserId: "operator-1", linkedAt: timestamp },
  ];
  const populated = await read(binding({ operationalRoom: { ...binding().operationalRoom, links } }));
  check(populated.standing === "ESTABLISHED", "links read under canonical room");
  if (populated.standing !== "ESTABLISHED") throw new Error("unreachable");
  check(populated.workstreams.length === 3, "only accepted workstream targets emitted");
  check(populated.excludedLinkCount === 1, "unsupported target counted, not disclosed");
  check(populated.workstreams[0]?.targetId === "dossier-1", "dossier identity retained");
  check(populated.workstreams[1]?.targetId === "case-1", "case identity retained");
  check(populated.workstreams[2]?.targetId === "opportunity-1", "opportunity identity retained");
  check(populated.workstreams.every((x) => x.disclosure === "LINK_METADATA_ONLY"), "all links metadata-only");
  check(populated.workstreams.every((x) => !Object.hasOwn(x, "state") && !Object.hasOwn(x, "title")), "no target state or titles fetched");
  check(!populated.operationallyUsable, "link existence never grants operations");

  const foreign = await read(binding({ operationalRoom: { ...binding().operationalRoom, links: [{ ...links[0], roomId: "different-room" }] } }));
  check(foreign.standing === "REVIEW_REQUIRED", "foreign room link conflicts");
  check(foreign.workstreams.length === 0, "foreign room link never disclosed");

  console.log(`GM-V2.2A.3: ${assertions} assertions passed; link metadata only, operational authority withheld.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
