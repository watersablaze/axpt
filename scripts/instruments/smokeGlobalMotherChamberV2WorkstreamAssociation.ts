import assert from "node:assert/strict";
import {
  resolveChamberV2WorkstreamAssociation,
  type ChamberWorkstreamAssociationInput,
  type ChamberWorkstreamAssociationDenial,
} from "../../src/domains/instruments/global-mother/resolveChamberV2WorkstreamAssociation";

let assertions = 0;
const check = (condition: boolean, label: string): void => {
  assert.ok(condition, label);
  assertions++;
};

const valid: ChamberWorkstreamAssociationInput = {
  instrumentReference: "GM-KENYA-RCF-001",
  cycleLabel: "Chamber V2",
  canonicalRoomId: "room-001",
  requestedRoomId: "room-001",
  bindingStanding: "BOUND",
  roomClass: "GENERAL_OPERATIONS",
  roomClientId: "gm-kenya-rcf-001-chamber-v2",
  roomTitle: "Global Mother · Chamber V2",
  roomStatus: "ACTIVE",
  operatorUserId: "operator-001",
  operatorIsAdmin: true,
  operatorCanManageCommunications: true,
  operatorIsConversationMember: true,
  conversationKind: "GROUP",
  conversationWritable: true,
  targetType: "TRANSACTION_DOSSIER",
  targetSubtype: "TRANSACTION_DOSSIER",
  targetId: "dossier-001",
  targetExists: true,
  targetAssociationPermissionEstablished: true,
  targetAssociationPermissionCurrent: true,
  matchingLinkAlreadyExists: false,
};

function denied(
  patch: Partial<ChamberWorkstreamAssociationInput>,
  reason: ChamberWorkstreamAssociationDenial,
): void {
  const result = resolveChamberV2WorkstreamAssociation({ ...valid, ...patch });
  check(result.standing === "WITHHELD", `withheld ${JSON.stringify(patch)}`);
  check(result.reason === reason, `reason ${reason}`);
  check(result.operationallyUsable === false, "no operational grant");
  check(result.eligibleForTransactionalRecheck === false, "no transactional recheck on denial");
}

for (const targetType of ["CASE", "OPPORTUNITY", "TRANSACTION_DOSSIER"] as const) {
  const result = resolveChamberV2WorkstreamAssociation({
    ...valid, targetType, targetSubtype: targetType,
  });
  check(result.standing === "ELIGIBLE_FOR_TRANSACTIONAL_RECHECK", `allowed ${targetType}`);
  check(result.eligibleForTransactionalRecheck === true, "recheck only");
  check(result.operationallyUsable === false, "never operational");
}
const duplicate = resolveChamberV2WorkstreamAssociation({ ...valid, matchingLinkAlreadyExists: true });
check(duplicate.standing === "ELIGIBLE_FOR_TRANSACTIONAL_RECHECK", "authorized duplicate");
check(duplicate.standing === "ELIGIBLE_FOR_TRANSACTIONAL_RECHECK" && duplicate.associationMode === "EXISTING_LINK", "duplicate mode");
check(duplicate.operationallyUsable === false, "duplicate never operational");

const cases: Array<[Partial<ChamberWorkstreamAssociationInput>, ChamberWorkstreamAssociationDenial]> = [
  [{ operatorIsAdmin: false }, "OPERATOR_NOT_AUTHORIZED"],
  [{ operatorCanManageCommunications: false }, "OPERATOR_NOT_AUTHORIZED"],
  [{ operatorIsConversationMember: false }, "OPERATOR_NOT_AUTHORIZED"],
  [{ instrumentReference: "other" }, "CHAMBER_BINDING_INVALID"],
  [{ cycleLabel: "other" }, "CHAMBER_BINDING_INVALID"],
  [{ bindingStanding: "REVOKED" }, "CHAMBER_BINDING_INVALID"],
  [{ roomClass: "TRANSACTION" }, "CHAMBER_BINDING_INVALID"],
  [{ roomClientId: "foreign" }, "CHAMBER_BINDING_INVALID"],
  [{ roomTitle: "foreign" }, "CHAMBER_BINDING_INVALID"],
  [{ roomStatus: "ARCHIVED" }, "CHAMBER_BINDING_INVALID"],
  [{ requestedRoomId: "foreign" }, "ROOM_NOT_CANONICAL"],
  [{ conversationKind: "DIRECT" }, "ROOM_NOT_WRITABLE"],
  [{ conversationWritable: false }, "ROOM_NOT_WRITABLE"],
  [{ targetType: "TRANSACTION", targetSubtype: "TRANSACTION" }, "TARGET_UNSUPPORTED"],
  [{ targetType: "TREASURY_GATEWAY_AGGREGATE", targetSubtype: "TREASURY_GATEWAY_AGGREGATE" }, "TARGET_UNSUPPORTED"],
  [{ targetSubtype: "CASE" }, "TARGET_POINTER_INVALID"],
  [{ targetExists: false }, "TARGET_NOT_FOUND"],
  [{ targetAssociationPermissionEstablished: false }, "TARGET_ASSOCIATION_AUTHORITY_MISSING"],
  [{ targetAssociationPermissionCurrent: false }, "TARGET_ASSOCIATION_AUTHORITY_MISSING"],
  [{ operatorUserId: "" }, "INCOMPLETE_EVIDENCE"],
  [{ canonicalRoomId: "" }, "INCOMPLETE_EVIDENCE"],
  [{ targetId: "  " }, "INCOMPLETE_EVIDENCE"],
];
for (const [patch, reason] of cases) denied(patch, reason);
for (const [patch, reason] of cases) denied({ ...patch, matchingLinkAlreadyExists: true }, reason);
console.log(`GM-V2.3A.3: ${assertions} assertions passed; transactional recheck required, no write authority.`);
