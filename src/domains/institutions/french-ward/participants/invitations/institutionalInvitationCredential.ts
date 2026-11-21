import {
  createHash,
  randomBytes,
} from "node:crypto";

export const
FRENCH_WARD_INSTITUTIONAL_INVITATION_CREDENTIAL_BYTES =
  32 as const;

/**
 * Private bearer credential for a French-Ward institutional
 * participation invitation.
 *
 * Raw credential material may exist only at the immediate issuance
 * boundary and in the recipient-controlled access URL.
 *
 * It must never be persisted.
 */
export function
generateFrenchWardInstitutionalInvitationCredential() {
  return randomBytes(
    FRENCH_WARD_INSTITUTIONAL_INVITATION_CREDENTIAL_BYTES,
  ).toString("base64url");
}

export function
hashFrenchWardInstitutionalInvitationCredential(
  credential: string,
) {
  return createHash("sha256")
    .update(
      credential,
      "utf8",
    )
    .digest("hex");
}
