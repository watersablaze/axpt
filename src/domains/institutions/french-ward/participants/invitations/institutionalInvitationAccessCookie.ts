export const
FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE =
  "fw_institutional_invitation";

export const
FRENCH_WARD_INSTITUTIONAL_WELCOME_PATH =
  "/french-ward/institutional/welcome";

export const
FRENCH_WARD_INSTITUTIONAL_ROOT_PATH =
  "/french-ward/institutional";

export function
frenchWardInstitutionalInvitationCookieOptions(
  expiresAt: Date,
) {
  return {
    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      "lax" as const,

    path:
      FRENCH_WARD_INSTITUTIONAL_ROOT_PATH,

    expires:
      expiresAt,
  };
}

export function
expiredFrenchWardInstitutionalInvitationCookieOptions() {
  return {
    httpOnly:
      true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      "lax" as const,

    path:
      FRENCH_WARD_INSTITUTIONAL_ROOT_PATH,

    maxAge:
      0,
  };
}
