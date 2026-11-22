import {
  assertRepresentativeAuthorityConditions,
} from "../authorityIntegrity";

import {
  type RepresentativeAuthorityConditions,
} from "../contracts";

import {
  resolveRepresentativeProgramAuthorityExercisabilityWithClient,
  type RepresentativeProgramAuthorityResolutionClient,
} from "../queries/resolveRepresentativeProgramAuthorityExercisabilityWithClient";

import {
  REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON,
  type RepresentativeAuthorityApplicabilityContext,
  type RepresentativeAuthorityApplicabilityRequest,
  type RepresentativeAuthorityApplicabilityResult,
} from "./contracts";

export type RepresentativeProgramAuthorityApplicabilityClient =
  RepresentativeProgramAuthorityResolutionClient;

function normalizeOptional(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function conditionIncludes(
  allowed: readonly string[] | undefined,
  actual: string,
): boolean {
  if (!allowed?.length) {
    return true;
  }

  return allowed.includes(actual);
}

/**
 * Resolve whether an otherwise relevant Representative Program
 * authority reaches one specific commercial context.
 *
 * EXERCISABLE ≠ APPLICABLE
 *
 * This resolver:
 * - delegates lifecycle / standing / appointment truth to the canonical
 *   exercisability resolver;
 * - evaluates only already-defined ARP authority conditions;
 * - does not grant, record, replace or revoke authority;
 * - does not create transaction, counterparty or approval truth;
 * - does not infer monetary-limit semantics.
 */
export async function resolveRepresentativeProgramAuthorityApplicabilityWithClient(
  params: Readonly<{
    client:
      RepresentativeProgramAuthorityApplicabilityClient;

    request:
      RepresentativeAuthorityApplicabilityRequest;
  }>,
): Promise<RepresentativeAuthorityApplicabilityResult> {
  const at =
    params.request.at ??
    new Date();

  const context:
    RepresentativeAuthorityApplicabilityContext = {
      transactionReference:
        normalizeOptional(
          params.request.context
            .transactionReference,
        ),

      counterpartyReference:
        normalizeOptional(
          params.request.context
            .counterpartyReference,
        ),

      territory:
        normalizeOptional(
          params.request.context
            .territory,
        ),

      documentClass:
        normalizeOptional(
          params.request.context
            .documentClass,
        ),

      monetaryContext:
        params.request.context
          .monetaryContext,

      approvalReference:
        normalizeOptional(
          params.request.context
            .approvalReference,
        ),
    };

  const exercisability =
    await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
      client:
        params.client,

      appointmentId:
        params.request.appointmentId,

      authorityKey:
        params.request.authorityKey,

      at,
    });

  const base = {
    authorityKey:
      params.request.authorityKey,

    exercisable:
      exercisability.exercisable,

    exercisabilityReason:
      exercisability.reason,

    evaluatedAt:
      at,

    ...(context.transactionReference
      ? {
          transactionReference:
            context.transactionReference,
        }
      : {}),

    ...(context.counterpartyReference
      ? {
          counterpartyReference:
            context.counterpartyReference,
        }
      : {}),

    ...(context.territory
      ? {
          territory:
            context.territory,
        }
      : {}),

    ...(context.documentClass
      ? {
          documentClass:
            context.documentClass,
        }
      : {}),
  } as const;

  const result = (
    applicable: boolean,
    reason:
      RepresentativeAuthorityApplicabilityResult["reason"],
    detail?: Readonly<{
      approvalRequired?: boolean;
      approvalAuthority?: string;
      monetaryEvaluationDeferred?: boolean;
    }>,
  ): RepresentativeAuthorityApplicabilityResult => ({
    ...base,
    applicable,
    reason,
    ...(detail ?? {}),
  });

  if (!exercisability.exercisable) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
        .AUTHORITY_NOT_EXERCISABLE,
    );
  }

  if (!exercisability.authority) {
    throw new Error(
      "[ARP_AUTHORITY_APPLICABILITY_EXERCISABLE_WITHOUT_AUTHORITY]",
    );
  }

  assertRepresentativeAuthorityConditions(
    exercisability.authority.conditions,
  );

  const conditions:
    RepresentativeAuthorityConditions =
      exercisability.authority.conditions ??
      {};

  if (
    conditions.transactionReferences?.length
  ) {
    if (!context.transactionReference) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .TRANSACTION_REFERENCE_REQUIRED,
      );
    }

    if (
      !conditionIncludes(
        conditions.transactionReferences,
        context.transactionReference,
      )
    ) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .TRANSACTION_OUT_OF_SCOPE,
      );
    }
  }

  if (
    conditions.counterpartyReferences?.length
  ) {
    if (!context.counterpartyReference) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .COUNTERPARTY_REFERENCE_REQUIRED,
      );
    }

    if (
      !conditionIncludes(
        conditions.counterpartyReferences,
        context.counterpartyReference,
      )
    ) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .COUNTERPARTY_OUT_OF_SCOPE,
      );
    }
  }

  if (conditions.territory?.length) {
    if (!context.territory) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .TERRITORY_REQUIRED,
      );
    }

    if (
      !conditionIncludes(
        conditions.territory,
        context.territory,
      )
    ) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .TERRITORY_OUT_OF_SCOPE,
      );
    }
  }

  if (
    conditions.documentClasses?.length
  ) {
    if (!context.documentClass) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .DOCUMENT_CLASS_REQUIRED,
      );
    }

    if (
      !conditionIncludes(
        conditions.documentClasses,
        context.documentClass,
      )
    ) {
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
          .DOCUMENT_CLASS_OUT_OF_SCOPE,
      );
    }
  }

  if (
    conditions.requiresPriorApproval ===
      true
  ) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
        .PRIOR_APPROVAL_REQUIRED,
      {
        approvalRequired:
          true,

        approvalAuthority:
          conditions.approvalAuthority,
      },
    );
  }

  /*
   * Monetary-limit semantics are deliberately not inferred.
   *
   * The existing ARP applicability contract explicitly leaves
   * monetary evaluation unresolved. Presence of a monetary limit
   * therefore fails closed until that doctrine exists.
   */
  if (conditions.monetaryLimit) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
        .MONETARY_LIMIT_REQUIRES_EVALUATION,
      {
        monetaryEvaluationDeferred:
          true,
      },
    );
  }

  return result(
    true,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .APPLICABLE,
  );
}
