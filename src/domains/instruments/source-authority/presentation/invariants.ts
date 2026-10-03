import {
  SOURCE_AUTHORITY_PRESENTATION_AUDIENCES,
  type SourceAuthorityPresentationAudience,
  type SourceAuthorityPresentationProjection,
} from "./contracts";

const VALID_AUDIENCES =
  new Set<string>(
    SOURCE_AUTHORITY_PRESENTATION_AUDIENCES,
  );

function assertNonEmpty(
  value: string,
  code: string,
): void {
  if (value.trim().length === 0) {
    throw new Error(code);
  }
}

function assertVisibleTo(
  visibleTo:
    readonly SourceAuthorityPresentationAudience[],
): void {
  if (visibleTo.length === 0) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_VISIBILITY_REQUIRED",
    );
  }

  const unique =
    new Set(visibleTo);

  if (unique.size !== visibleTo.length) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_VISIBILITY_DUPLICATE",
    );
  }

  for (const audience of visibleTo) {
    if (!VALID_AUDIENCES.has(audience)) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_AUDIENCE_INVALID",
      );
    }
  }
}

export function assertSourceAuthorityPresentationProjection(
  projection:
    SourceAuthorityPresentationProjection,
): void {
  if (!VALID_AUDIENCES.has(projection.audience)) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_AUDIENCE_INVALID",
    );
  }

  assertNonEmpty(
    projection.identity.sourceAuthorityId,
    "SOURCE_AUTHORITY_PRESENTATION_SOURCE_AUTHORITY_ID_REQUIRED",
  );

  assertNonEmpty(
    projection.identity.instrumentId,
    "SOURCE_AUTHORITY_PRESENTATION_INSTRUMENT_ID_REQUIRED",
  );

  assertNonEmpty(
    projection.identity.instrumentReference,
    "SOURCE_AUTHORITY_PRESENTATION_INSTRUMENT_REFERENCE_REQUIRED",
  );

  assertNonEmpty(
    projection.identity.instrumentTitle,
    "SOURCE_AUTHORITY_PRESENTATION_INSTRUMENT_TITLE_REQUIRED",
  );

  if (
    projection.identity.versionNumber < 1
  ) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_VERSION_INVALID",
    );
  }

  const assertionReferences =
    new Set<string>();

  for (
    const assertion
    of projection.assertions
  ) {
    assertNonEmpty(
      assertion.reference,
      "SOURCE_AUTHORITY_PRESENTATION_ASSERTION_REFERENCE_REQUIRED",
    );

    if (
      assertionReferences.has(
        assertion.reference,
      )
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_ASSERTION_REFERENCE_DUPLICATE",
      );
    }

    assertionReferences.add(
      assertion.reference,
    );

    assertVisibleTo(
      assertion.visibleTo,
    );

    if (
      assertion.transactionAuthorityConferred !==
        false ||
      assertion.sovereignAuthorityConferred !==
        false
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_ASSERTION_AUTHORITY_FORBIDDEN",
      );
    }

    for (
      const evidence
      of assertion.evidence
    ) {
      assertVisibleTo(
        evidence.visibleTo,
      );
    }

    for (
      const capability
      of assertion.capabilities
    ) {
      assertVisibleTo(
        capability.visibleTo,
      );

      if (
        capability
          .currentCommodityAvailabilityEstablished !==
          false ||
        capability
          .transactionAuthorityConferred !==
          false
      ) {
        throw new Error(
          "SOURCE_AUTHORITY_PRESENTATION_CAPABILITY_AUTHORITY_FORBIDDEN",
        );
      }
    }

    const recognition =
      assertion.recognition;

    if (!recognition) {
      continue;
    }

    if (
      recognition.assertionReference !==
      assertion.reference
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_RECOGNITION_ASSERTION_MISMATCH",
      );
    }

    if (
      recognition.transactionAuthorityConferred !==
        false ||
      recognition.sovereignAuthorityConferred !==
        false
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_RECOGNITION_AUTHORITY_FORBIDDEN",
      );
    }

    if (
      (
        recognition.outcome ===
          "RECOGNIZED" ||
        recognition.outcome ===
          "RECOGNIZED_WITH_LIMITATION"
      ) &&
      recognition.evidenceIds.length === 0
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_RECOGNITION_EVIDENCE_REQUIRED",
      );
    }

    if (
      recognition.outcome ===
        "RECOGNIZED_WITH_LIMITATION" &&
      !recognition.limitation?.trim()
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_RECOGNITION_LIMITATION_REQUIRED",
      );
    }

    if (
      recognition.outcome ===
        "NOT_RECOGNIZED" &&
      !recognition.reason?.trim()
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_NON_RECOGNITION_REASON_REQUIRED",
      );
    }
  }

  const evidenceIds =
    new Set<string>();

  for (
    const evidence
    of projection.evidenceRegister
  ) {
    assertNonEmpty(
      evidence.evidenceId,
      "SOURCE_AUTHORITY_PRESENTATION_EVIDENCE_ID_REQUIRED",
    );

    if (
      evidenceIds.has(
        evidence.evidenceId,
      )
    ) {
      throw new Error(
        "SOURCE_AUTHORITY_PRESENTATION_EVIDENCE_DUPLICATE",
      );
    }

    evidenceIds.add(
      evidence.evidenceId,
    );

    assertVisibleTo(
      evidence.visibleTo,
    );
  }

  const boundary =
    projection.boundary;

  if (
    boundary.sovereignAuthorityEstablished !==
      false ||
    boundary.regulatoryApprovalEstablished !==
      false ||
    boundary.exportAuthorizationEstablished !==
      false ||
    boundary.commodityAvailabilityEstablished !==
      false ||
    boundary.commodityAllocationEstablished !==
      false ||
    boundary.titleEstablished !==
      false ||
    boundary.transactionAuthorityConferred !==
      false ||
    boundary.settlementAuthorityConferred !==
      false
  ) {
    throw new Error(
      "SOURCE_AUTHORITY_PRESENTATION_BOUNDARY_VIOLATION",
    );
  }

  assertNonEmpty(
    boundary.statement,
    "SOURCE_AUTHORITY_PRESENTATION_BOUNDARY_STATEMENT_REQUIRED",
  );
}
