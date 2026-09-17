import { createHash } from "node:crypto";

export function hashInstrumentAccessToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function instrumentAccessCookieName(publicId: string) {
  const suffix = createHash("sha256")
    .update(publicId, "utf8")
    .digest("hex")
    .slice(0, 16);

  return `fw_dsi_access_${suffix}`;
}
