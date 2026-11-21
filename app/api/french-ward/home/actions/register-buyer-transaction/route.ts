import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  loadNeonObjectStorageConfig,
} from "@/domains/instruments/transaction-documents/neonObjectStorage";

import {
  createExternalIntakeConditionalS3Store,
} from "@/domains/control-center/transaction-intakes/externalIntakeConditionalS3Store";

import {
  registerFrenchWardBuyerTransactionWithCustody,
} from "@/domains/control-center/transaction-intakes/registerFrenchWardBuyerTransactionWithCustody";

import {
  registerExternalIntakeWithClient,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

import {
  resolveFrenchWardActionAuthorityWithClient,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

import {
  createFrenchWardBuyerTransactionPost,
} from "@/domains/control-center/transaction-intakes/createFrenchWardBuyerTransactionPost";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const POST =
  createFrenchWardBuyerTransactionPost({
    getPrincipal,
    prisma,
    resolveFrenchWardActionAuthorityWithClient,
    loadNeonObjectStorageConfig,
    createExternalIntakeConditionalS3Store,
    registerFrenchWardBuyerTransactionWithCustody,
    registerExternalIntakeWithClient,
  });
