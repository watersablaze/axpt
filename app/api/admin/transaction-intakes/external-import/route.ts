import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";

import {
  loadNeonObjectStorageConfig,
} from "@/domains/instruments/transaction-documents/neonObjectStorage";

import {
  createExternalIntakeConditionalS3Store,
} from "@/domains/control-center/transaction-intakes/externalIntakeConditionalS3Store";

import {
  registerExternalIntakeWithCustody,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithCustody";

import {
  registerExternalIntakeWithClient,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

import {
  createExternalImportPost,
} from "@/domains/control-center/transaction-intakes/createExternalImportPost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createExternalImportPost({
  getPrincipal,
  prisma,
  loadNeonObjectStorageConfig,
  createExternalIntakeConditionalS3Store,
  registerExternalIntakeWithCustody,
  registerExternalIntakeWithClient,
});
