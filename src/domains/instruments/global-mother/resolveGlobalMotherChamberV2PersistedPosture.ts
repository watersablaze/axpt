import {
  globalMotherCycleV2Plan as plan,
} from "../definitions/globalMotherCycleV2Plan";

import {
  resolveChamberV2ParticipationEligibility,
  type ChamberV2ParticipantKey,
  type ChamberV2EligibilityResult,
} from "./resolveChamberV2ParticipationEligibility";

export type PersistedAdmission = {
  instrumentReference: string;
  cycleLabel: string;
  participantKey: string;
  institution: string;
  capacity: string;
  participantUserId: string | null;
  standing: string;
  capacityEvidenceReference: string | null;
  capacityVerifiedByUserId: string | null;
  capacityVerifiedAt: Date | null;
  admittedByUserId: string | null;
  admittedAt: Date | null;
  decisionReason: string | null;
  revokedByUserId: string | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};

export type PersistedRoomBinding = {
  instrumentReference: string;
  cycleLabel: string;
  standing: string;
  operationalRoomId: string | null;
  boundByUserId: string | null;
  boundAt: Date | null;
  bindingReason: string | null;
  revokedByUserId: string | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};

export type PersistedRoom = {
  id: string;
  clientRoomId: string;
  roomClass: string;
};

export type PersistedPostureInput = {
  participantKey: ChamberV2ParticipantKey;
  admissions: PersistedAdmission[];
  bindings: PersistedRoomBinding[];
  rooms: PersistedRoom[];
  linkedUserExists: boolean;
};

export type PersistedPosture = {
  participantKey: ChamberV2ParticipantKey;
  standing: "WITHHELD" | "STRUCTURALLY_READY";
  reasons: string[];
  admissionStanding: string | null;
  bindingStanding: string | null;
  linkedUserId: string | null;
  canonicalRoomId: string | null;
  independentIdentityVerified: false;
  independentCapacityVerified: false;
  eligibility: ChamberV2EligibilityResult;
};

function filled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveGlobalMotherChamberV2PersistedPosture(
  input: PersistedPostureInput,
): PersistedPosture {
  const participant = plan.participants.find(
    (candidate) => candidate.key === input.participantKey,
  );

  if (!participant) {
    throw new Error("GM_V2_PARTICIPANT_NOT_PLANNED");
  }

  const reasons: string[] = [];

  const admission =
    input.admissions.length === 1 ? input.admissions[0] : null;

  const binding =
    input.bindings.length === 1 ? input.bindings[0] : null;

  if (input.admissions.length === 0) {
    reasons.push("ADMISSION_MISSING");
  } else if (input.admissions.length !== 1) {
    reasons.push("ADMISSION_AMBIGUOUS");
  }

  if (admission) {
    if (
      admission.instrumentReference !== plan.instrumentReference ||
      admission.cycleLabel !== plan.cycleLabel ||
      admission.participantKey !== participant.key ||
      admission.institution !== participant.institution ||
      admission.capacity !== participant.capacity
    ) {
      reasons.push("ADMISSION_SCOPE_OR_CAPACITY_MISMATCH");
    }

    if (
      admission.standing === "REVOKED" ||
      admission.revokedAt !== null ||
      admission.revokedByUserId !== null
    ) {
      reasons.push("ADMISSION_REVOKED");
    } else if (admission.standing !== "ADMITTED") {
      reasons.push("ADMISSION_NOT_EFFECTIVE");
    }

    if (
      !filled(admission.participantUserId) ||
      !input.linkedUserExists
    ) {
      reasons.push("PARTICIPANT_USER_UNRESOLVED");
    }

    if (
      !filled(admission.capacityEvidenceReference) ||
      !filled(admission.capacityVerifiedByUserId) ||
      !admission.capacityVerifiedAt ||
      !filled(admission.admittedByUserId) ||
      !admission.admittedAt ||
      !filled(admission.decisionReason)
    ) {
      reasons.push("ADMISSION_EVIDENCE_INCOMPLETE");
    }

    if (
      admission.standing !== "REVOKED" &&
      (
        admission.revocationReason !== null ||
        admission.revokedAt !== null ||
        admission.revokedByUserId !== null
      )
    ) {
      reasons.push("ADMISSION_REVOCATION_CONTRADICTION");
    }
  }

  if (input.bindings.length === 0) {
    reasons.push("ROOM_BINDING_MISSING");
  } else if (input.bindings.length !== 1) {
    reasons.push("ROOM_BINDING_AMBIGUOUS");
  }

  if (binding) {
    if (
      binding.instrumentReference !== plan.instrumentReference ||
      binding.cycleLabel !== plan.cycleLabel
    ) {
      reasons.push("ROOM_BINDING_CYCLE_MISMATCH");
    }

    if (
      binding.standing === "REVOKED" ||
      binding.revokedAt !== null ||
      binding.revokedByUserId !== null
    ) {
      reasons.push("ROOM_BINDING_REVOKED");
    } else if (binding.standing !== "BOUND") {
      reasons.push("ROOM_BINDING_NOT_EFFECTIVE");
    }

    if (
      !filled(binding.operationalRoomId) ||
      !filled(binding.boundByUserId) ||
      !binding.boundAt ||
      !filled(binding.bindingReason)
    ) {
      reasons.push("ROOM_BINDING_INCOMPLETE");
    }

    if (
      binding.standing !== "REVOKED" &&
      binding.revocationReason !== null
    ) {
      reasons.push("ROOM_BINDING_REVOCATION_CONTRADICTION");
    }
  }

  const matchingRooms = input.rooms.filter(
    (room) =>
      room.clientRoomId === plan.communications.clientRoomId,
  );

  if (matchingRooms.length > 1) {
    reasons.push("ROOM_TOPOLOGY_AMBIGUOUS");
  }

  const canonicalRoom =
    binding?.operationalRoomId
      ? input.rooms.find(
          (room) => room.id === binding.operationalRoomId,
        )
      : undefined;

  if (
    !canonicalRoom ||
    canonicalRoom.clientRoomId !== plan.communications.clientRoomId ||
    canonicalRoom.roomClass !== plan.communications.roomClass ||
    matchingRooms.length !== 1 ||
    matchingRooms[0].id !== canonicalRoom.id
  ) {
    reasons.push("CANONICAL_ROOM_MISMATCH");
  }

  // This release has no independent verification authority.
  // Never promote admission-row claims into VERIFIED evidence.
  if (admission && filled(admission.capacityEvidenceReference)) {
    reasons.push("CAPACITY_NOT_INDEPENDENTLY_VERIFIED");
  }

  const eligibility = resolveChamberV2ParticipationEligibility(
    participant.key,
    {
      identity: admission?.participantUserId
        ? {
            userId: admission.participantUserId,
            participantKey: participant.key,
            standing: "UNVERIFIED",
          }
        : null,

      capacity: null,

      admission: admission
        ? {
            userId: admission.participantUserId ?? "",
            participantKey: participant.key,
            instrumentReference: admission.instrumentReference,
            cycleLabel: admission.cycleLabel,
            standing:
              admission.standing === "REVOKED"
                ? "REVOKED"
                : admission.standing === "ADMITTED"
                  ? "ADMITTED"
                  : "NOT_ADMITTED",
          }
        : null,

      room:
        matchingRooms.length > 1 ||
        input.bindings.length > 1
          ? { standing: "AMBIGUOUS" }
          : binding?.standing === "REVOKED"
            ? { standing: "AMBIGUOUS" }
            : canonicalRoom &&
                matchingRooms.length === 1 &&
                binding?.standing === "BOUND"
              ? {
                  standing: "CANONICAL",
                  operationalRoomId: canonicalRoom.id,
                  clientRoomId: canonicalRoom.clientRoomId,
                }
              : { standing: "NOT_ESTABLISHED" },
    },
  );

  const structurallyReady =
    reasons.length === 1 &&
    reasons[0] === "CAPACITY_NOT_INDEPENDENTLY_VERIFIED";

  if (eligibility.standing === "ELIGIBLE") {
    throw new Error("GM_V2_UNTRUSTED_ELIGIBILITY_ESCALATION");
  }

  return {
    participantKey: participant.key,
    standing: structurallyReady
      ? "STRUCTURALLY_READY"
      : "WITHHELD",
    reasons,
    admissionStanding: admission?.standing ?? null,
    bindingStanding: binding?.standing ?? null,
    linkedUserId: admission?.participantUserId ?? null,
    canonicalRoomId:
      structurallyReady ? canonicalRoom?.id ?? null : null,
    independentIdentityVerified: false,
    independentCapacityVerified: false,
    eligibility,
  };
}
