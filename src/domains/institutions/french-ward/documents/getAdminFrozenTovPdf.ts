import "server-only";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { TOV_PUBLICATION } from "@/domains/institutions/french-ward/tovPublication";
import { createNeonObjectStorage } from "@/domains/instruments/transaction-documents/neonObjectStorage";
import { resolveAuthorizedFrozenTovPdf } from "./resolveAuthorizedFrozenTovPdf";

/** Runtime boundary: real persisted institutional identity and private custody only. */
export async function getAdminFrozenTovPdf() {
  const principal = await getPrincipal();
  // Never open storage for unauthenticated or unauthorized requests.
  if (!principal || !isAdmin(principal)) return null;
  return resolveAuthorizedFrozenTovPdf({
    actor: principal,
    publication: TOV_PUBLICATION,
    reader: createNeonObjectStorage(),
  });
}
