import {
  NextResponse,
} from "next/server";

import type {
  getPrincipal as GetPrincipalFn,
} from "@/domains/auth/getPrincipal";

import type {
  prisma as PrismaInstance,
} from "@/infrastructure/db/prisma";

import type {
  loadNeonObjectStorageConfig as LoadStorageConfigFn,
} from "@/domains/instruments/transaction-documents/neonObjectStorage";

import type {
  createExternalIntakeConditionalS3Store as CreateStoreFn,
} from "@/domains/control-center/transaction-intakes/externalIntakeConditionalS3Store";

import {
  FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,
} from "@/domains/control-center/transaction-intakes/registerFrenchWardBuyerTransactionWithCustody";

import type {
  registerFrenchWardBuyerTransactionWithCustody as RegisterFrenchWardFn,
} from "@/domains/control-center/transaction-intakes/registerFrenchWardBuyerTransactionWithCustody";

import type {
  registerExternalIntakeWithClient as RegisterWithClientFn,
} from "@/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

import {
  ExternalIntakeHttpError,
  parseExternalIntakeOperatorForm,
  readBoundedExternalIntakeForm,
  validateExternalIntakeRequest,
} from "@/domains/control-center/transaction-intakes/parseExternalIntakeOperatorRequest";

import {
  FRENCH_WARD_ACTION,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

import type {
  resolveFrenchWardActionAuthorityWithClient as ResolveAuthorityFn,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

function respond(
  body: unknown,
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",

        "Referrer-Policy":
          "no-referrer",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

type Dependencies = {
  getPrincipal:
    typeof GetPrincipalFn;

  prisma:
    typeof PrismaInstance;

  resolveFrenchWardActionAuthorityWithClient:
    typeof ResolveAuthorityFn;

  loadNeonObjectStorageConfig:
    typeof LoadStorageConfigFn;

  createExternalIntakeConditionalS3Store:
    typeof CreateStoreFn;

  registerFrenchWardBuyerTransactionWithCustody:
    typeof RegisterFrenchWardFn;

  registerExternalIntakeWithClient:
    typeof RegisterWithClientFn;
};

/**
 * Governing French-Ward HTTP entrance for documentary registration of
 * an externally introduced buyer / transaction.
 *
 * This boundary does not grant buyer, representative, negotiation,
 * signature, promotion, settlement or instrument authority.
 *
 * Browser input cannot choose:
 * - acting user;
 * - institutional capability;
 * - authority mode;
 * - custody reference;
 * - evidence digest;
 * - governing confirmation.
 */
export function createFrenchWardBuyerTransactionPost(
  deps: Dependencies,
) {
  const {
    getPrincipal,
    prisma,
    resolveFrenchWardActionAuthorityWithClient,
    loadNeonObjectStorageConfig,
    createExternalIntakeConditionalS3Store,
    registerFrenchWardBuyerTransactionWithCustody,
    registerExternalIntakeWithClient,
  } = deps;

  return async function POST(
    request: Request,
  ) {
    try {
      const principal =
        await getPrincipal();

      if (!principal) {
        return respond(
          {
            ok: false,
            error:
              "AUTHENTICATION_REQUIRED",
          },
          401,
        );
      }

      /*
       * Request-origin validation happens before reading multipart bytes.
       */
      validateExternalIntakeRequest(
        request,
      );

      /*
       * Fail closed before reading or storing uploaded evidence.
       * The wrapper and transaction layer independently re-check this.
       */
      const authority =
        await resolveFrenchWardActionAuthorityWithClient({
          client:
            prisma,

          userId:
            principal.userId,

          action:
            FRENCH_WARD_ACTION
              .REGISTER_BUYER_TRANSACTION,
        });

      if (!authority.allowed) {
        return respond(
          {
            ok: false,
            error:
              "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED",
          },
          403,
        );
      }

      let form:
        FormData;

      try {
        form =
          await readBoundedExternalIntakeForm(
            request,
          );
      } catch (error) {
        if (
          error instanceof
          ExternalIntakeHttpError
        ) {
          throw error;
        }

        return respond(
          {
            ok: false,
            error:
              "INVALID_FORM_DATA",
          },
          400,
        );
      }

      /*
       * Governing confirmation is server authority, not browser authority.
       * Any browser-supplied value is replaced; omission is also valid.
       */
      form.set(
        "confirmation",
        FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,
      );

      const parsed =
        parseExternalIntakeOperatorForm(
          form,
        );

      const config =
        loadNeonObjectStorageConfig();

      if (!config) {
        return respond(
          {
            ok: false,
            error:
              "PRIVATE_STORAGE_UNAVAILABLE",
          },
          503,
        );
      }

      const bytes =
        new Uint8Array(
          await parsed
            .evidencePdf
            .arrayBuffer(),
        );

      const store =
        createExternalIntakeConditionalS3Store(
          config,
        );

      const result =
        await registerFrenchWardBuyerTransactionWithCustody({
          client:
            prisma,

          principal: {
            userId:
              principal.userId,

            email:
              principal.email,
          },

          confirmation:
            FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION,

          registration: {
            ...parsed.registration,
            evidenceBytes:
              bytes,
          },

          store,

          register:
            registration =>
              registerExternalIntakeWithClient(
                prisma,
                registration,
              ),
        });

      return respond(
        {
          ok: true,

          intake: {
            id:
              result.receipt
                .intakeId,

            reference:
              result.receipt
                .intakeReference,

            status:
              result.receipt
                .status,

            alreadyRegistered:
              result.receipt
                .alreadyRegistered,
          },

          evidence: {
            sha256:
              result.custody
                .sha256,

            byteLength:
              result.custody
                .byteLength,

            disposition:
              result.custody
                .disposition,
          },

          registrationMode:
            "FRENCH_WARD_GOVERNING_REGISTER",

          buyerAuthorityVerified:
            false,

          representativeAuthorityGranted:
            false,

          opportunityPromoted:
            false,
        },
        result.receipt
          .alreadyRegistered
          ? 200
          : 201,
      );
    } catch (error) {
      if (
        error instanceof
        ExternalIntakeHttpError
      ) {
        return respond(
          {
            ok: false,
            error:
              error.reason,
          },
          error.status,
        );
      }

      const reason =
        error instanceof Error
          ? error.message
          : "";

      if (
        reason ===
          "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED" ||
        reason ===
          "FW_TXN_OPERATOR_UNAUTHORIZED"
      ) {
        return respond(
          {
            ok: false,
            error:
              "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED",
          },
          403,
        );
      }

      if (
        reason.startsWith(
          "FW_TXN_REQUIRED:",
        ) ||
        reason.startsWith(
          "FW_TXN_INVALID_",
        ) ||
        reason ===
          "FW_TXN_EVIDENCE_BYTES_INVALID" ||
        reason ===
          "FW_TXN_EVIDENCE_HASH_MISMATCH" ||
        reason ===
          "FW_TXN_EXPLICIT_CONFIRMATION_REQUIRED" ||
        reason ===
          "FW_TXN_CUSTODY_INVALID_EVIDENCE"
      ) {
        return respond(
          {
            ok: false,
            error:
              "INVALID_EXTERNAL_INTAKE",
          },
          400,
        );
      }

      if (
        reason ===
          "FW_TXN_REGISTRATION_CONFLICT" ||
        reason.startsWith(
          "FW_TXN_EXISTING_PROVENANCE_",
        )
      ) {
        return respond(
          {
            ok: false,
            error:
              "REGISTRATION_CONFLICT",
          },
          409,
        );
      }

      if (
        reason.startsWith(
          "FW_TXN_CUSTODY_",
        ) ||
        reason.startsWith(
          "FW_TXN_S3_",
        )
      ) {
        return respond(
          {
            ok: false,
            error:
              "EVIDENCE_CUSTODY_UNAVAILABLE",
          },
          503,
        );
      }

      console.error(
        "[french-ward:governing-registration]",
        error,
      );

      return respond(
        {
          ok: false,
          error:
            "REGISTRATION_FAILED",
        },
        500,
      );
    }
  };
}
