import "server-only";

import { createHash } from "node:crypto";
import { put } from "@vercel/blob";

import type { PrivateAgreementEvidenceStore } from "../commands/assembleMasterAgreementEvidence";

/**
 * Stores reviewed agreement evidence in a connected private Vercel Blob store.
 * Content-addressed paths permit a retry after a later database failure.
 */
export const vercelPrivateMasterAgreementStore: PrivateAgreementEvidenceStore = {
  async putPrivate(input) {
    const actualHash = createHash("sha256")
      .update(input.bytes)
      .digest("hex");

    if (actualHash !== input.sha256) {
      throw new Error("[ARP_MASTER_AGREEMENT_STORAGE_HASH_MISMATCH]");
    }

    const blob = await put(input.key, Buffer.from(input.bytes), {
      access: "private",
      contentType: input.contentType,
      allowOverwrite: true,
    });

    let location: URL;
    try {
      location = new URL(blob.url);
    } catch {
      throw new Error("[ARP_MASTER_AGREEMENT_PRIVATE_BLOB_URL_INVALID]");
    }

    if (
      location.protocol !== "https:" ||
      !location.hostname.endsWith(".private.blob.vercel-storage.com") ||
      location.search ||
      location.hash
    ) {
      throw new Error("[ARP_MASTER_AGREEMENT_PRIVATE_BLOB_URL_INVALID]");
    }

    return { uri: blob.url, access: "private" };
  },
};
