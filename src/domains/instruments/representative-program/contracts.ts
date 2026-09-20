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
