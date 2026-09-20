export const REPRESENTATIVE_APPOINTMENT_CLASS = {
  REGISTERED_COMMERCIAL_INTRODUCER: "REGISTERED_COMMERCIAL_INTRODUCER",
  AUTHORIZED_COMMERCIAL_REPRESENTATIVE:
    "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
  TRANSACTION_REPRESENTATIVE: "TRANSACTION_REPRESENTATIVE",
  COMMERCIAL_MANDATE: "COMMERCIAL_MANDATE",
} as const;

export type RepresentativeAppointmentClass =
  (typeof REPRESENTATIVE_APPOINTMENT_CLASS)[keyof typeof REPRESENTATIVE_APPOINTMENT_CLASS];

export const REPRESENTATIVE_PROGRAM_STANDING = {
  PROVISIONAL: "PROVISIONAL",
  ACTIVE: "ACTIVE",
  RESTRICTED: "RESTRICTED",
  SUSPENDED: "SUSPENDED",
  EXPIRED: "EXPIRED",
  WITHDRAWN: "WITHDRAWN",
  REVOKED: "REVOKED",
} as const;

export type RepresentativeProgramStanding =
  (typeof REPRESENTATIVE_PROGRAM_STANDING)[keyof typeof REPRESENTATIVE_PROGRAM_STANDING];

export const REPRESENTATIVE_PROGRAM_INITIAL_STANDINGS = [
  REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL,
  REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
  REPRESENTATIVE_PROGRAM_STANDING.RESTRICTED,
] as const;

export const REPRESENTATIVE_PROGRAM_DOCKET_PREFIX = "FWI" as const;
export const REPRESENTATIVE_PROGRAM_DOCKET_FAMILY = "RP" as const;

export function isRepresentativeProgramInitialStanding(
  standing: RepresentativeProgramStanding,
): boolean {
  return (
    standing === REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL ||
    standing === REPRESENTATIVE_PROGRAM_STANDING.ACTIVE ||
    standing === REPRESENTATIVE_PROGRAM_STANDING.RESTRICTED
  );
}

export function assertRepresentativeProgramStandingTransition(params: {
  from: RepresentativeProgramStanding;
  to: RepresentativeProgramStanding;
}): void {
  if (params.from === params.to) {
    throw new Error(
      `[ARP_STANDING_NOOP] standing=${params.from}`,
    );
  }

  if (params.to === REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL) {
    throw new Error(
      `[ARP_STANDING_CANNOT_RETURN_TO_PROVISIONAL] from=${params.from}`,
    );
  }

  if (
    params.from === REPRESENTATIVE_PROGRAM_STANDING.EXPIRED ||
    params.from === REPRESENTATIVE_PROGRAM_STANDING.WITHDRAWN ||
    params.from === REPRESENTATIVE_PROGRAM_STANDING.REVOKED
  ) {
    throw new Error(
      `[ARP_STANDING_TERMINAL] from=${params.from} to=${params.to}`,
    );
  }
}

export const REPRESENTATIVE_AUTHORITY_KEY = {
  ACCESS: "ARP.ACCESS",
  INTRODUCTION: "ARP.INTRODUCTION",
  COMMUNICATION: "ARP.COMMUNICATION",
  PRESENTATION: "ARP.PRESENTATION",
  COORDINATION: "ARP.COORDINATION",
  NEGOTIATION: "ARP.NEGOTIATION",
  DOCUMENTARY_AUTHORITY: "ARP.DOCUMENTARY_AUTHORITY",
  BINDING_AUTHORITY: "ARP.BINDING_AUTHORITY",
} as const;

export type RepresentativeAuthorityKey =
  (typeof REPRESENTATIVE_AUTHORITY_KEY)[keyof typeof REPRESENTATIVE_AUTHORITY_KEY];

export const REPRESENTATIVE_AUTHORITY_TITLE = {
  [REPRESENTATIVE_AUTHORITY_KEY.ACCESS]: "Commercial Access Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION]: "Introduction Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION]: "Communication Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION]: "Presentation Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.COORDINATION]: "Coordination Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION]: "Negotiation Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.DOCUMENTARY_AUTHORITY]: "Documentary Authority",
  [REPRESENTATIVE_AUTHORITY_KEY.BINDING_AUTHORITY]: "Binding Authority",
} as const satisfies Record<RepresentativeAuthorityKey, string>;

export type RepresentativeAuthorityConditions = Readonly<{
  transactionReferences?: readonly string[];
  counterpartyReferences?: readonly string[];
  territory?: readonly string[];
  requiresPriorApproval?: boolean;
  approvalAuthority?: string;
  documentClasses?: readonly string[];
  monetaryLimit?: string;
  allowWhileRestricted?: boolean;
  notes?: string;
}>;

export const REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON = {
  EXERCISABLE: "EXERCISABLE",
  AUTHORITY_NOT_RECORDED: "AUTHORITY_NOT_RECORDED",
  AUTHORITY_RESERVED: "AUTHORITY_RESERVED",
  AUTHORITY_PROHIBITED: "AUTHORITY_PROHIBITED",
  JOINT_AUTHORITY_REQUIRES_COORDINATION:
    "JOINT_AUTHORITY_REQUIRES_COORDINATION",
  APPOINTMENT_NOT_YET_EFFECTIVE: "APPOINTMENT_NOT_YET_EFFECTIVE",
  APPOINTMENT_EXPIRED: "APPOINTMENT_EXPIRED",
  APPOINTMENT_ENDED: "APPOINTMENT_ENDED",
  PARTICIPANT_PROVISIONAL: "PARTICIPANT_PROVISIONAL",
  PARTICIPANT_RESTRICTED: "PARTICIPANT_RESTRICTED",
  PARTICIPANT_SUSPENDED: "PARTICIPANT_SUSPENDED",
  PARTICIPANT_EXPIRED: "PARTICIPANT_EXPIRED",
  PARTICIPANT_WITHDRAWN: "PARTICIPANT_WITHDRAWN",
  PARTICIPANT_REVOKED: "PARTICIPANT_REVOKED",
} as const;

export type RepresentativeAuthorityExercisabilityReason =
  (typeof REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON)[keyof typeof REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON];

export function isRepresentativeAuthorityKey(
  value: string,
): value is RepresentativeAuthorityKey {
  return Object.values(REPRESENTATIVE_AUTHORITY_KEY).includes(
    value as RepresentativeAuthorityKey,
  );
}

export function representativeAuthorityConditionsAllowRestrictedStanding(
  conditions: unknown,
): boolean {
  if (
    !conditions ||
    typeof conditions !== "object" ||
    Array.isArray(conditions)
  ) {
    return false;
  }

  return (
    (
      conditions as {
        allowWhileRestricted?: unknown;
      }
    ).allowWhileRestricted === true
  );
}

export function isRepresentativeProgramTerminalStanding(
  standing: RepresentativeProgramStanding,
): boolean {
  return (
    standing === REPRESENTATIVE_PROGRAM_STANDING.EXPIRED ||
    standing === REPRESENTATIVE_PROGRAM_STANDING.WITHDRAWN ||
    standing === REPRESENTATIVE_PROGRAM_STANDING.REVOKED
  );
}
