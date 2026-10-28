import {
  globalMotherCycleV2Plan,
} from "../definitions/globalMotherCycleV2Plan";

export type ChamberV2ParticipantKey =
  (typeof globalMotherCycleV2Plan.participants)[number]["key"];

export type ChamberV2EligibilityStanding =
  | "PLANNED"
  | "IDENTITY_UNRESOLVED"
  | "CAPACITY_UNVERIFIED"
  | "ADMISSION_NOT_ESTABLISHED"
  | "ROOM_NOT_ESTABLISHED"
  | "ELIGIBLE"
  | "WITHHELD";

export type ChamberV2EvidenceStanding =
  | "VERIFIED"
  | "UNVERIFIED"
  | "REVOKED"
  | "CONFLICTED";

export type ChamberV2AdmissionStanding =
  | "ADMITTED"
  | "NOT_ADMITTED"
  | "REVOKED"
  | "CONFLICTED";

export type ChamberV2RoomStanding =
  | "CANONICAL"
  | "NOT_ESTABLISHED"
  | "AMBIGUOUS";

export type ChamberV2EligibilityEvidence = {
  /**
   * Resolved identity must be linked to this participant.
   * No identity is inferred from the planned roster.
   */
  identity?: {
    userId: string;
    participantKey: string;
    standing: ChamberV2EvidenceStanding;
  } | null;

  /**
   * Evidence must independently support the exact
   * institution and capacity named in the V2 plan.
   */
  capacity?: {
    userId: string;
    institution: string;
    capacity: string;
    standing: ChamberV2EvidenceStanding;
  } | null;

  /**
   * This is a verified cycle-scoped admission assertion,
   * not an instrument-access or Communications permission.
   *
   * No durable admission records are created by this type.
   */
  admission?: {
    userId: string;
    participantKey: string;
    instrumentReference: string;
    cycleLabel: string;
    standing: ChamberV2AdmissionStanding;
  } | null;

  /**
   * A canonical room ID is evidence of binding only.
   * A client-provided room identifier is insufficient.
   */
  room?: {
    standing: ChamberV2RoomStanding;
    operationalRoomId?: string | null;
    clientRoomId?: string | null;
  } | null;
};

export type ChamberV2EligibilityResult = {
  instrumentReference: string;
  cycleLabel: string;
  participantKey: ChamberV2ParticipantKey;
  institution: string;
  capacity: string;
  standing: ChamberV2EligibilityStanding;
  reasons: string[];
  userId: string | null;
  operationalRoomId: string | null;
};

function nonempty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveChamberV2ParticipationEligibility(
  participantKey: ChamberV2ParticipantKey,
  evidence: ChamberV2EligibilityEvidence = {},
): ChamberV2EligibilityResult {
  const plan = globalMotherCycleV2Plan;

  const participant = plan.participants.find(
    (entry) => entry.key === participantKey,
  );

  if (!participant) {
    throw new Error("GM_V2_PARTICIPANT_NOT_PLANNED");
  }

  const identity = evidence.identity ?? null;
  const capacity = evidence.capacity ?? null;
  const admission = evidence.admission ?? null;
  const room = evidence.room ?? null;

  const reasons: string[] = [];

  const base = {
    instrumentReference: plan.instrumentReference,
    cycleLabel: plan.cycleLabel,
    participantKey,
    institution: participant.institution,
    capacity: participant.capacity,
  };

  function result(
    standing: ChamberV2EligibilityStanding,
  ): ChamberV2EligibilityResult {
    return {
      ...base,
      standing,
      reasons,
      userId: identity?.standing === "VERIFIED" &&
        nonempty(identity.userId)
          ? identity.userId
          : null,
      operationalRoomId:
        standing === "ELIGIBLE"
          ? room?.operationalRoomId?.trim() || null
          : null,
    };
  }

  // Revocation and conflicting evidence take precedence
  // over any positive-looking eligibility assertions.
  if (
    identity?.standing === "REVOKED" ||
    identity?.standing === "CONFLICTED" ||
    capacity?.standing === "REVOKED" ||
    capacity?.standing === "CONFLICTED" ||
    admission?.standing === "REVOKED" ||
    admission?.standing === "CONFLICTED" ||
    room?.standing === "AMBIGUOUS"
  ) {
    reasons.push("CONFLICT_REVOCATION_OR_ROOM_AMBIGUITY");
    return result("WITHHELD");
  }

  if (!identity) {
    reasons.push("IDENTITY_EVIDENCE_ABSENT");
    return result("PLANNED");
  }

  if (
    identity.standing !== "VERIFIED" ||
    identity.participantKey !== participantKey ||
    !nonempty(identity.userId)
  ) {
    reasons.push("IDENTITY_NOT_VERIFIED_FOR_PARTICIPANT");
    return result("IDENTITY_UNRESOLVED");
  }

  if (
    !capacity ||
    capacity.standing !== "VERIFIED" ||
    capacity.userId !== identity.userId ||
    capacity.institution !== participant.institution ||
    capacity.capacity !== participant.capacity
  ) {
    reasons.push("INSTITUTIONAL_CAPACITY_UNVERIFIED");
    return result("CAPACITY_UNVERIFIED");
  }

  if (
    !admission ||
    admission.standing !== "ADMITTED" ||
    admission.userId !== identity.userId ||
    admission.participantKey !== participantKey ||
    admission.instrumentReference !== plan.instrumentReference ||
    admission.cycleLabel !== plan.cycleLabel
  ) {
    reasons.push("V2_CYCLE_ADMISSION_NOT_ESTABLISHED");
    return result("ADMISSION_NOT_ESTABLISHED");
  }

  if (
    !room ||
    room.standing !== "CANONICAL" ||
    !nonempty(room.operationalRoomId) ||
    room.clientRoomId !== plan.communications.clientRoomId
  ) {
    reasons.push("CANONICAL_CHAMBER_ROOM_NOT_ESTABLISHED");
    return result("ROOM_NOT_ESTABLISHED");
  }

  // This is an eligibility assessment only.
  // It does not authorize a command or mutate standing.
  return result("ELIGIBLE");
}
