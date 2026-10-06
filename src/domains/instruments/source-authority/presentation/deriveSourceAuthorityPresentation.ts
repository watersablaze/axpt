import type {
  SourceAuthorityAssertionClass,
  SourceAuthorityCapabilityKey,
  SourceAuthorityRecognitionOutcome,
  SourceAuthoritySubject,
} from "../contracts";

import {
  assertSourceAuthorityPresentationProjection,
} from "./invariants";

import {
  deriveSourceAuthorityPresentationStanding,
} from "./standing";

import {
  isSourceAuthorityAssertionVisible,
  isSourceAuthorityEvidenceVisible,
  isSourceAuthorityOperatorHistoryVisible,
} from "./visibilityPolicy";

import type {
  SourceAuthorityPresentationAudience,
  SourceAuthorityPresentationBoundary,
  SourceAuthorityPresentationProfileParticulars,
  SourceAuthorityPresentationProjection,
} from "./contracts";

export type CanonicalSourceAuthorityPresentationEvidence =
  Readonly<{
    evidenceId: string;
    evidenceRole: string;
    label: string;
    reference: string | null;
    admittedAt: string | null;
  }>;

export type CanonicalSourceAuthorityPresentationCapability =
  Readonly<{
    capabilityKey:
      SourceAuthorityCapabilityKey;

    title: string;
    description: string;

    assertionReference: string;
  }>;

export type CanonicalSourceAuthorityPresentationRecognition =
  Readonly<{
    recognitionId: string;

    assertionReference: string;

    outcome:
      SourceAuthorityRecognitionOutcome;

    evidenceIds:
      readonly string[];

    actorUserId:
      string;

    actorDisplayName:
      string | null;

    occurredAt:
      string;

    limitation:
      string | null;

    reason:
      string | null;

    supersedesRecognitionId:
      string | null;

    supersededByRecognitionId:
      string | null;
  }>;

export type CanonicalSourceAuthorityPresentationAssertion =
  Readonly<{
    reference: string;

    assertionClass:
      SourceAuthorityAssertionClass;

    title: string;
    statement: string;
    scope: string | null;

    evidenceIds:
      readonly string[];

    capabilities:
      readonly CanonicalSourceAuthorityPresentationCapability[];

    currentRecognition:
      CanonicalSourceAuthorityPresentationRecognition | null;
  }>;

export type CanonicalSourceAuthorityPresentationState =
  Readonly<{
    identity: Readonly<{
      sourceAuthorityId: string;
      instrumentId: string;
      instrumentReference: string;
      instrumentTitle: string;
      versionId: string;
      versionNumber: number;
      subject: SourceAuthoritySubject;

      profileParticulars:
        SourceAuthorityPresentationProfileParticulars;
    }>;

    assertions:
      readonly CanonicalSourceAuthorityPresentationAssertion[];

    evidence:
      readonly CanonicalSourceAuthorityPresentationEvidence[];

    recognitionHistory:
      readonly CanonicalSourceAuthorityPresentationRecognition[];
  }>;

export const SOURCE_AUTHORITY_PRESENTATION_BOUNDARY:
  SourceAuthorityPresentationBoundary = {
    sovereignAuthorityEstablished:
      false,

    regulatoryApprovalEstablished:
      false,

    exportAuthorizationEstablished:
      false,

    commodityAvailabilityEstablished:
      false,

    commodityAllocationEstablished:
      false,

    titleEstablished:
      false,

    transactionAuthorityConferred:
      false,

    settlementAuthorityConferred:
      false,

    statement:
      "This Source Authority presentation records institutional assertions, documentary evidence, capabilities, and operator recognition. It does not itself establish sovereign State authority, regulatory approval, export authorization, commodity availability or allocation, title, transaction authority, or settlement authority.",
  };

export function deriveSourceAuthorityPresentation({
  audience,
  canonical,
}: Readonly<{
  audience:
    SourceAuthorityPresentationAudience;

  canonical:
    CanonicalSourceAuthorityPresentationState;
}>): SourceAuthorityPresentationProjection {
  const evidenceById =
    new Map(
      canonical.evidence.map(
        (evidence) => [
          evidence.evidenceId,
          evidence,
        ] as const,
      ),
    );

  const visibleAssertions =
    canonical.assertions.filter(
      (assertion) =>
        isSourceAuthorityAssertionVisible({
          audience,
          assertionReference:
            assertion.reference,
          assertionClass:
            assertion.assertionClass,
        }),
    );

  const projectedEvidence =
    canonical.evidence
      .filter(() =>
        isSourceAuthorityEvidenceVisible({
          audience,
        }),
      )
      .map((evidence) => ({
        ...evidence,

        visibleTo: [
          audience,
        ] as const,
      }));

  const projectedAssertions =
    visibleAssertions.map(
      (assertion) => {
        const evidence =
          assertion.evidenceIds
            .map((evidenceId) =>
              evidenceById.get(
                evidenceId,
              ),
            )
            .filter(
              (
                candidate,
              ): candidate is
                CanonicalSourceAuthorityPresentationEvidence =>
                Boolean(candidate),
            )
            .filter(() =>
              isSourceAuthorityEvidenceVisible({
                audience,
              }),
            )
            .map(
              (candidate) => ({
                ...candidate,

                visibleTo: [
                  audience,
                ] as const,
              }),
            );

        const recognition =
          assertion.currentRecognition
            ? {
                recognitionId:
                  assertion
                    .currentRecognition
                    .recognitionId,

                assertionReference:
                  assertion.reference,

                outcome:
                  assertion
                    .currentRecognition
                    .outcome,

                evidenceIds:
                  [
                    ...assertion
                      .currentRecognition
                      .evidenceIds,
                  ],

                actorUserId:
                  audience === "OPERATOR"
                    ? assertion
                        .currentRecognition
                        .actorUserId
                    : null,

                actorDisplayName:
                  audience === "OPERATOR"
                    ? assertion
                        .currentRecognition
                        .actorDisplayName
                    : null,

                occurredAt:
                  assertion
                    .currentRecognition
                    .occurredAt,

                limitation:
                  assertion
                    .currentRecognition
                    .limitation,

                reason:
                  assertion
                    .currentRecognition
                    .reason,

                supersedesRecognitionId:
                  audience === "OPERATOR"
                    ? assertion
                        .currentRecognition
                        .supersedesRecognitionId
                    : null,

                transactionAuthorityConferred:
                  false as const,

                sovereignAuthorityConferred:
                  false as const,
              }
            : null;

        const capabilities =
          assertion.capabilities.map(
            (capability) => ({
              ...capability,

              currentCommodityAvailabilityEstablished:
                false as const,

              transactionAuthorityConferred:
                false as const,

              visibleTo: [
                audience,
              ] as const,
            }),
          );

        return {
          reference:
            assertion.reference,

          assertionClass:
            assertion.assertionClass,

          title:
            assertion.title,

          statement:
            assertion.statement,

          scope:
            assertion.scope,

          transactionAuthorityConferred:
            false as const,

          sovereignAuthorityConferred:
            false as const,

          visibleTo: [
            audience,
          ] as const,

          recognition,
          evidence,
          capabilities,
        };
      },
    );

  const capabilities =
    projectedAssertions.flatMap(
      (assertion) =>
        assertion.capabilities,
    );

  const currentRecognitions =
    projectedAssertions
      .map(
        (assertion) =>
          assertion.recognition,
      )
      .filter(
        (
          recognition,
        ): recognition is
          NonNullable<
            typeof recognition
          > =>
          Boolean(recognition),
      );

  const operatorRecord =
    isSourceAuthorityOperatorHistoryVisible(
      audience,
    )
      ? canonical.recognitionHistory.map(
          (recognition) => ({
            recognitionId:
              recognition.recognitionId,

            assertionReference:
              recognition.assertionReference,

            outcome:
              recognition.outcome,

            actorUserId:
              recognition.actorUserId,

            occurredAt:
              recognition.occurredAt,

            limitation:
              recognition.limitation,

            reason:
              recognition.reason,

            evidenceIds:
              [
                ...recognition.evidenceIds,
              ],

            supersedesRecognitionId:
              recognition
                .supersedesRecognitionId,

            supersededByRecognitionId:
              recognition
                .supersededByRecognitionId,
          }),
        )
      : [];

  const projection:
    SourceAuthorityPresentationProjection = {
      audience,

      identity:
        canonical.identity,

      standing:
        deriveSourceAuthorityPresentationStanding(
          currentRecognitions,
        ),

      assertions:
        projectedAssertions,

      evidenceRegister:
        projectedEvidence,

      capabilities,

      operatorRecord,

      boundary:
        SOURCE_AUTHORITY_PRESENTATION_BOUNDARY,
    };

  assertSourceAuthorityPresentationProjection(
    projection,
  );

  return projection;
}
