export type FrenchWardInstitutionalInvitationState =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type FrenchWardInstitutionalInvitationStateInput =
  Readonly<{
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
  }>;

export function resolveFrenchWardInstitutionalInvitationState(
  input: FrenchWardInstitutionalInvitationStateInput,
  now: Date,
): FrenchWardInstitutionalInvitationState {
  if (input.revokedAt !== null) {
    return "REVOKED";
  }

  if (input.acceptedAt !== null) {
    return "ACCEPTED";
  }

  if (
    !Number.isFinite(now.getTime()) ||
    !Number.isFinite(
      input.expiresAt.getTime(),
    )
  ) {
    return "EXPIRED";
  }

  if (input.expiresAt <= now) {
    return "EXPIRED";
  }

  return "PENDING";
}

export function canAcceptFrenchWardInstitutionalInvitation(
  input: FrenchWardInstitutionalInvitationStateInput,
  now: Date,
) {
  return (
    resolveFrenchWardInstitutionalInvitationState(
      input,
      now,
    ) === "PENDING"
  );
}
