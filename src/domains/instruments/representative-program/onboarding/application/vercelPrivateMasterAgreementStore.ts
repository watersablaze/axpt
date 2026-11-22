import "server-only";

import { createHash } from "node:crypto";

import {
  createNeonObjectStorage,
} from "@/domains/instruments/transaction-documents/neonObjectStorage";

import type {
  PrivateAgreementEvidenceStore,
} from "../commands/assembleMasterAgreementEvidence";

/**
 * Stores reviewed Master Agreement execution evidence in AXPT's
 * existing private S3-compatible object store.
 *
 * Content-addressed paths make retries safe after a later database
 * transaction failure. The returned s3:// URI is an internal evidence
 * locator only; it does not expose a public object URL.
 */
export const vercelPrivateMasterAgreementStore:
  PrivateAgreementEvidenceStore = {
    async putPrivate(input) {
      const actualHash =
        createHash("sha256")
          .update(input.bytes)
          .digest("hex");

      if (actualHash !== input.sha256) {
        throw new Error(
          "[ARP_MASTER_AGREEMENT_STORAGE_HASH_MISMATCH]",
        );
      }

      const storage =
        createNeonObjectStorage();

      const bucket =
        process.env
          .AXPT_TRANSACTION_DOCUMENT_BUCKET
          ?.trim();

      if (!storage || !bucket) {
        throw new Error(
          "[ARP_MASTER_AGREEMENT_PRIVATE_STORAGE_UNAVAILABLE]",
        );
      }

      await storage.write(
        input.key,
        input.bytes,
        input.contentType,
      );

      return {
        uri: `s3://${bucket}/${input.key}`,
        access: "private",
      };
    },
  };
