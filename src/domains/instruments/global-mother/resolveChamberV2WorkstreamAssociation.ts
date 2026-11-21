/**
 * GM-V2.3A.3 — Pure, fail-closed preparation decision.
 *
 * This policy does not authorize a database write, target disclosure,
 * Chamber membership, or institutional representation. All evidence inputs
 * must be independently established by a later transactional adapter.
 */
export type ChamberWorkstreamTargetType =
  | "CASE"
  | "OPPORTUNITY"
  | "TRANSACTION_DOSSIER";

export type ChamberWorkstreamAssociationInput = {
  instrumentReference: string;
  cycleLabel: string;
  canonicalRoomId: string;
  requestedRoomId: string;
  bindingStanding: string;
  roomClass: string;
  roomClientId: string;
  roomTitle: string;
  roomStatus: string;
  operatorUserId: string;
  operatorIsAdmin: boolean;
  operatorCanManageCommunications: boolean;
  operatorIsConversationMember: boolean;
  conversationKind: string;
  conversationWritable: boolean;
  targetType: string;
  targetSubtype: string;
  targetId: string;
  targetExists: boolean;
  targetAssociationPermissionEstablished: boolean;
  targetAssociationPermissionCurrent: boolean;
  /** A duplicate link must not bypass any of the above conditions. */
  matchingLinkAlreadyExists: boolean;
};

export type ChamberWorkstreamAssociationDenial =
  | "INCOMPLETE_EVIDENCE"
  | "OPERATOR_NOT_AUTHORIZED"
  | "CHAMBER_BINDING_INVALID"
  | "ROOM_NOT_CANONICAL"
  | "ROOM_NOT_WRITABLE"
  | "TARGET_UNSUPPORTED"
  | "TARGET_POINTER_INVALID"
  | "TARGET_NOT_FOUND"
  | "TARGET_ASSOCIATION_AUTHORITY_MISSING";

export type ChamberWorkstreamAssociationDecision =
  | {
      standing: "WITHHELD";
      reason: ChamberWorkstreamAssociationDenial;
      eligibleForTransactionalRecheck: false;
      operationallyUsable: false;
    }
  | {
      standing: "ELIGIBLE_FOR_TRANSACTIONAL_RECHECK";
      reason: "ALL_PRECONDITIONS_ASSERTED";
      associationMode: "EXISTING_LINK" | "NEW_LINK";
      eligibleForTransactionalRecheck: true;
      operationallyUsable: false;
    };

const INSTRUMENT = "GM-KENYA-RCF-001";
const CYCLE = "Chamber V2";
const ROOM_CLIENT_ID = "gm-kenya-rcf-001-chamber-v2";
const ROOM_TITLE = "Global Mother · Chamber V2";
const ALLOWED = new Set<ChamberWorkstreamTargetType>([
  "CASE", "OPPORTUNITY", "TRANSACTION_DOSSIER",
]);

function filled(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function withheld(reason: ChamberWorkstreamAssociationDenial): ChamberWorkstreamAssociationDecision {
  return {
    standing: "WITHHELD",
    reason,
    eligibleForTransactionalRecheck: false,
    operationallyUsable: false,
  };
}

export function resolveChamberV2WorkstreamAssociation(
  input: ChamberWorkstreamAssociationInput,
): ChamberWorkstreamAssociationDecision {
  if (
    !input ||
    !filled(input.instrumentReference) ||
    !filled(input.cycleLabel) ||
    !filled(input.canonicalRoomId) ||
    !filled(input.requestedRoomId) ||
    !filled(input.operatorUserId) ||
    !filled(input.targetType) ||
    !filled(input.targetSubtype) ||
    !filled(input.targetId)
  ) return withheld("INCOMPLETE_EVIDENCE");

  if (!input.operatorIsAdmin || !input.operatorCanManageCommunications ||
      !input.operatorIsConversationMember) {
    return withheld("OPERATOR_NOT_AUTHORIZED");
  }

  if (
    input.instrumentReference !== INSTRUMENT ||
    input.cycleLabel !== CYCLE ||
    input.bindingStanding !== "BOUND" ||
    input.roomClass !== "GENERAL_OPERATIONS" ||
    input.roomClientId !== ROOM_CLIENT_ID ||
    input.roomTitle !== ROOM_TITLE ||
    input.roomStatus !== "ACTIVE"
  ) return withheld("CHAMBER_BINDING_INVALID");

  if (input.requestedRoomId !== input.canonicalRoomId) {
    return withheld("ROOM_NOT_CANONICAL");
  }

  if (input.conversationKind !== "GROUP" || !input.conversationWritable) {
    return withheld("ROOM_NOT_WRITABLE");
  }

  if (!ALLOWED.has(input.targetType as ChamberWorkstreamTargetType)) {
    return withheld("TARGET_UNSUPPORTED");
  }

  if (input.targetSubtype !== input.targetType) {
    return withheld("TARGET_POINTER_INVALID");
  }

  if (!input.targetExists) return withheld("TARGET_NOT_FOUND");

  if (!input.targetAssociationPermissionEstablished ||
      !input.targetAssociationPermissionCurrent) {
    return withheld("TARGET_ASSOCIATION_AUTHORITY_MISSING");
  }

  return {
    standing: "ELIGIBLE_FOR_TRANSACTIONAL_RECHECK",
    reason: "ALL_PRECONDITIONS_ASSERTED",
    associationMode: input.matchingLinkAlreadyExists ? "EXISTING_LINK" : "NEW_LINK",
    eligibleForTransactionalRecheck: true,
    operationallyUsable: false,
  };
}
