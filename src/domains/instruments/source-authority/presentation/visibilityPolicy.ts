import type {
  SourceAuthorityAssertionClass,
} from "../contracts";

import type {
  SourceAuthorityPresentationAudience,
} from "./contracts";

/**
 * Presentation visibility is policy, not authority.
 *
 * Hiding or revealing an assertion does not alter the underlying
 * Source Authority Instrument, its evidence, or its recognition state.
 */

export type SourceAuthorityPresentationVisibilityInput =
  Readonly<{
    audience:
      SourceAuthorityPresentationAudience;

    assertionReference:
      string;

    assertionClass:
      SourceAuthorityAssertionClass;
  }>;

/**
 * A006 is the internal boundary assertion in the canonical Bafoula
 * Source Authority manifest.
 *
 * External surfaces still receive the permanent presentation boundary
 * object, but do not need the internal governance assertion itself.
 */
const OPERATOR_ONLY_ASSERTION_REFERENCES =
  new Set<string>([
    "BAF-SAI-2026-001:A006",
  ]);

export function isSourceAuthorityAssertionVisible(
  input:
    SourceAuthorityPresentationVisibilityInput,
): boolean {
  if (input.audience === "OPERATOR") {
    return true;
  }

  if (
    OPERATOR_ONLY_ASSERTION_REFERENCES.has(
      input.assertionReference,
    )
  ) {
    return false;
  }

  return true;
}

export function isSourceAuthorityEvidenceVisible({
  audience,
}: Readonly<{
  audience:
    SourceAuthorityPresentationAudience;
}>): boolean {
  /**
   * SAI-4B.3 establishes the first projection policy:
   * admitted evidence references are presentable to all three
   * audiences.
   *
   * Raw evidence bytes, document access, and release controls are
   * deliberately outside this derivation policy.
   */
  return (
    audience === "OPERATOR" ||
    audience === "RECIPIENT" ||
    audience === "REPRESENTATIVE"
  );
}

export function isSourceAuthorityOperatorHistoryVisible(
  audience:
    SourceAuthorityPresentationAudience,
): boolean {
  return audience === "OPERATOR";
}
