import {
  SOURCE_AUTHORITY_CAPABILITY,
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
  type SourceAuthorityAssertion,
  type SourceAuthorityCapability,
  type SourceAuthorityCapabilityKey,
  type SourceAuthorityRecognition,
} from "./contracts";


function assertNonEmpty(
  value: string,
  code: string,
): void {
  if (value.trim().length === 0) {
    throw new Error(code);
  }
}


export function isSourceAuthorityCapabilityKey(
  value: string,
): value is SourceAuthorityCapabilityKey {
  return Object.values(
    SOURCE_AUTHORITY_CAPABILITY,
  ).includes(
    value as SourceAuthorityCapabilityKey,
  );
}


export function assertSourceAuthorityAssertion(
  assertion: SourceAuthorityAssertion,
): void {
  assertNonEmpty(
    assertion.reference,
    "[SOURCE_AUTHORITY_ASSERTION_REFERENCE_REQUIRED]",
  );

  assertNonEmpty(
    assertion.title,
    "[SOURCE_AUTHORITY_ASSERTION_TITLE_REQUIRED]",
  );

  assertNonEmpty(
    assertion.statement,
    "[SOURCE_AUTHORITY_ASSERTION_STATEMENT_REQUIRED]",
  );

  if (
    assertion.transactionAuthorityConferred !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_TRANSACTION_AUTHORITY_FORBIDDEN]",
    );
  }

  if (
    assertion.sovereignAuthorityConferred !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_SOVEREIGN_AUTHORITY_FORBIDDEN]",
    );
  }
}


export function assertSourceAuthorityCapability(
  capability: SourceAuthorityCapability,
): void {
  if (
    !isSourceAuthorityCapabilityKey(
      capability.capabilityKey,
    )
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_INVALID]",
    );
  }

  assertNonEmpty(
    capability.title,
    "[SOURCE_AUTHORITY_CAPABILITY_TITLE_REQUIRED]",
  );

  assertNonEmpty(
    capability.description,
    "[SOURCE_AUTHORITY_CAPABILITY_DESCRIPTION_REQUIRED]",
  );

  if (
    capability.transactionAuthorityConferred !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_TRANSACTION_AUTHORITY_FORBIDDEN]",
    );
  }

  if (
    capability.currentCommodityAvailabilityEstablished
      !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_AVAILABILITY_FORBIDDEN]",
    );
  }
}


export function assertSourceAuthorityRecognition(
  recognition: SourceAuthorityRecognition,
): void {
  assertNonEmpty(
    recognition.instrumentId,
    "[SOURCE_AUTHORITY_RECOGNITION_INSTRUMENT_REQUIRED]",
  );

  assertNonEmpty(
    recognition.assertionReference,
    "[SOURCE_AUTHORITY_RECOGNITION_ASSERTION_REQUIRED]",
  );

  assertNonEmpty(
    recognition.actorUserId,
    "[SOURCE_AUTHORITY_RECOGNITION_ACTOR_REQUIRED]",
  );

  if (
    recognition.transactionAuthorityConferred !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_TRANSACTION_AUTHORITY_FORBIDDEN]",
    );
  }

  if (
    recognition.sovereignAuthorityConferred !== false
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_SOVEREIGN_AUTHORITY_FORBIDDEN]",
    );
  }

  const uniqueEvidence =
    new Set(recognition.evidenceIds);

  if (
    uniqueEvidence.size !==
    recognition.evidenceIds.length
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_DUPLICATE_EVIDENCE]",
    );
  }

  const affirmative =
    recognition.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME.RECOGNIZED ||
    recognition.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .RECOGNIZED_WITH_LIMITATION;

  if (
    affirmative &&
    recognition.evidenceIds.length === 0
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_REQUIRED]",
    );
  }

  if (
    recognition.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .RECOGNIZED_WITH_LIMITATION &&
    (
      recognition.limitation === null ||
      recognition.limitation.trim().length === 0
    )
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_LIMITATION_REQUIRED]",
    );
  }

  if (
    recognition.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .NOT_RECOGNIZED &&
    (
      recognition.reason === null ||
      recognition.reason.trim().length === 0
    )
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_NON_RECOGNITION_REASON_REQUIRED]",
    );
  }
}


export function assertSourceAuthoritySubject(
  subject: import("./contracts").SourceAuthoritySubject,
): void {
  assertNonEmpty(
    subject.displayName,
    "[SOURCE_AUTHORITY_SUBJECT_NAME_REQUIRED]",
  );

  assertNonEmpty(
    subject.jurisdiction,
    "[SOURCE_AUTHORITY_SUBJECT_JURISDICTION_REQUIRED]",
  );

  assertNonEmpty(
    subject.institutionalCapacity,
    "[SOURCE_AUTHORITY_SUBJECT_CAPACITY_REQUIRED]",
  );

  const commodities =
    subject.principalCommodityActivity.map(
      (value) => value.trim(),
    );

  if (
    commodities.some(
      (value) => value.length === 0,
    )
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_SUBJECT_COMMODITY_EMPTY]",
    );
  }

  if (
    new Set(commodities).size !==
    commodities.length
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_SUBJECT_COMMODITY_DUPLICATE]",
    );
  }
}
