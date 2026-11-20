import { createHash, randomBytes } from "node:crypto";

export function generateRepresentativeOnboardingAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRepresentativeOnboardingAccessToken(
  rawToken: string,
): string {
  const token = rawToken.trim();

  if (!token) {
    throw new Error("[ARP_ONBOARDING_ACCESS_TOKEN_REQUIRED]");
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Intake references are operational onboarding references.
 *
 * They are NOT Program docket references.
 *
 * The Program Registry assigns the docket only at explicit admission.
 */
export function createRepresentativeOnboardingReference(params?: {
  at?: Date;
  entropy?: string;
}): string {
  const at = params?.at ?? new Date();

  if (!Number.isFinite(at.getTime())) {
    throw new Error("[ARP_ONBOARDING_REFERENCE_TIME_INVALID]");
  }

  const entropy =
    params?.entropy?.trim().toUpperCase() ??
    randomBytes(5).toString("hex").toUpperCase();

  if (!/^[A-Z0-9]{6,24}$/.test(entropy)) {
    throw new Error("[ARP_ONBOARDING_REFERENCE_ENTROPY_INVALID]");
  }

  const yy = String(at.getUTCFullYear() % 100).padStart(2, "0");

  return `FWI-${yy}-RP-ONB-${entropy}`;
}
