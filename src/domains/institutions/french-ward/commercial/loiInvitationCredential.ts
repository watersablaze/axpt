import {
  createHash,
  randomBytes,
} from "node:crypto";

export const FRENCH_WARD_LOI_CREDENTIAL_BYTES =
  32 as const;

/**
 * Bearer credential for one French-Ward governing LOI invitation.
 *
 * Raw credential material may appear only:
 * - in the immediate command return value;
 * - in the recipient access URL;
 * - in the scoped HttpOnly recipient cookie.
 *
 * It must never be persisted.
 */
export function generateFrenchWardLoiCredential() {
  return randomBytes(
    FRENCH_WARD_LOI_CREDENTIAL_BYTES,
  ).toString("base64url");
}

export function hashFrenchWardLoiCredential(
  credential: string,
) {
  return createHash("sha256")
    .update(
      credential,
      "utf8",
    )
    .digest("hex");
}

export const FRENCH_WARD_LOI_ACCESS_COOKIE =
  "fw_loi_access" as const;

export const FRENCH_WARD_LOI_ACCESS_PATH =
  "/french-ward/transaction-intake" as const;
