import { NextResponse } from "next/server";

import type { getPrincipal as GetPrincipalFn } from "@/domains/auth/getPrincipal";
import type { prisma as PrismaInstance } from "@/infrastructure/db/prisma";

import type {
  loadNeonObjectStorageConfig as LoadStorageConfigFn,
} from "@/domains/instruments/transaction-documents/neonObjectStorage";

import type {
  createExternalIntakeConditionalS3Store as CreateStoreFn,
} from "@/domains/control-center/transaction-intakes/externalIntakeConditionalS3Store";

import {
  EXTERNAL_INTAKE_CONFIRMATION,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithCustody";
import type {
  registerExternalIntakeWithCustody as RegisterWithCustodyFn,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithCustody";

import type {
  registerExternalIntakeWithClient as RegisterWithClientFn,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

import {
  ExternalIntakeHttpError,
  parseExternalIntakeOperatorForm,
  readBoundedExternalIntakeForm,
  validateExternalIntakeRequest,
} from "@/domains/control-center/transaction-intakes/parseExternalIntakeOperatorRequest";


function respond(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

type Dependencies = {
  getPrincipal: typeof GetPrincipalFn;
  prisma: typeof PrismaInstance;
  loadNeonObjectStorageConfig: typeof LoadStorageConfigFn;
  createExternalIntakeConditionalS3Store: typeof CreateStoreFn;
  registerExternalIntakeWithCustody: typeof RegisterWithCustodyFn;
  registerExternalIntakeWithClient: typeof RegisterWithClientFn;
};

/**
 * Injectable HTTP boundary.
 *
 * Production dependencies are supplied by the route adapter.
 * Acceptance tests supply synthetic dependencies instead.
 */
export function createExternalImportPost(deps: Dependencies) {
  const {
    getPrincipal,
    prisma,
    loadNeonObjectStorageConfig,
    createExternalIntakeConditionalS3Store,
    registerExternalIntakeWithCustody,
    registerExternalIntakeWithClient,
  } = deps;

  return async function POST(request: Request) {

  try {
    const principal = await getPrincipal();

    if (!principal) {
      return respond({ ok: false, error: "UNAUTHORIZED" }, 401);
    }

    if (
      !principal.roles.includes("ADMIN_PLATFORM") ||
      !principal.permissions.includes("ADMIN_SURFACE_ACCESS")
    ) {
      return respond({ ok: false, error: "FORBIDDEN" }, 403);
    }

    validateExternalIntakeRequest(request);

    // Independently check the persisted administrator before reading
    // uploaded bytes or writing any private storage objects.
    const operator = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { id: true, isAdmin: true },
    });

    if (!operator?.isAdmin) {
      return respond({ ok: false, error: "FORBIDDEN" }, 403);
    }

    let form: FormData;

    try {
      form = await readBoundedExternalIntakeForm(request);
    } catch (error) {
      if (error instanceof ExternalIntakeHttpError) throw error;
      return respond({ ok: false, error: "INVALID_FORM_DATA" }, 400);
    }

    const parsed = parseExternalIntakeOperatorForm(form);

    if (parsed.confirmation !== EXTERNAL_INTAKE_CONFIRMATION) {
      return respond(
        { ok: false, error: "EXPLICIT_CONFIRMATION_REQUIRED" },
        400,
      );
    }

    const config = loadNeonObjectStorageConfig();

    if (!config) {
      return respond(
        { ok: false, error: "PRIVATE_STORAGE_UNAVAILABLE" },
        503,
      );
    }

    const bytes = new Uint8Array(
      await parsed.evidencePdf.arrayBuffer(),
    );

    const store = createExternalIntakeConditionalS3Store(config);

    const result = await registerExternalIntakeWithCustody({
      principal,
      confirmation: parsed.confirmation,
      registration: {
        ...parsed.registration,
        evidenceBytes: bytes,
      },
      store,
      register: (registration) =>
        registerExternalIntakeWithClient(prisma, registration),
    });

    return respond({
      ok: true,
      intake: result.receipt,
      evidence: {
        reference: result.custody.reference,
        sha256: result.custody.sha256,
        byteLength: result.custody.byteLength,
        disposition: result.custody.disposition,
      },
      registrationMode: "OPERATOR_EXTERNAL_IMPORT",
      buyerAuthorityVerified: false,
      representativeAuthorityGranted: false,
      opportunityPromoted: false,
    }, result.receipt.alreadyRegistered ? 200 : 201);
  } catch (error) {
    if (error instanceof ExternalIntakeHttpError) {
      return respond(
        { ok: false, error: error.reason },
        error.status,
      );
    }

    const reason = error instanceof Error ? error.message : "";

    if (reason === "FW_TXN_OPERATOR_AUTHORITY_REQUIRED" ||
        reason === "FW_TXN_OPERATOR_UNAUTHORIZED") {
      return respond({ ok: false, error: "FORBIDDEN" }, 403);
    }

    if (
      reason.startsWith("FW_TXN_REQUIRED:") ||
      reason.startsWith("FW_TXN_INVALID_") ||
      reason === "FW_TXN_EVIDENCE_BYTES_INVALID" ||
      reason === "FW_TXN_EXPLICIT_CONFIRMATION_REQUIRED" ||
      reason === "FW_TXN_CUSTODY_INVALID_EVIDENCE"
    ) {
      return respond({ ok: false, error: "INVALID_EXTERNAL_INTAKE" }, 400);
    }

    if (
      reason === "FW_TXN_REGISTRATION_CONFLICT" ||
      reason.startsWith("FW_TXN_EXISTING_PROVENANCE_")
    ) {
      return respond({ ok: false, error: "REGISTRATION_CONFLICT" }, 409);
    }

    if (reason.startsWith("FW_TXN_CUSTODY_") ||
        reason.startsWith("FW_TXN_S3_")) {
      return respond({ ok: false, error: "EVIDENCE_CUSTODY_UNAVAILABLE" }, 503);
    }

    console.error("[fw-transactions:external-import]", error);
    return respond({ ok: false, error: "REGISTRATION_FAILED" }, 500);
  }
}
}
