import type { RepresentativeOnboardingSubmission } from "../contracts";

import type { RepresentativeOnboardingLifecycleTransactionRunner } from "../governance/runRepresentativeOnboardingTransaction";

import { runRepresentativeOnboardingLifecycleTransaction } from "../governance/runRepresentativeOnboardingTransaction";

import { submitRepresentativeOnboardingWithClient } from "./submitRepresentativeOnboardingWithClient";

import { beginRepresentativeOnboardingReviewWithClient } from "./beginRepresentativeOnboardingReviewWithClient";

import { qualifyRepresentativeOnboardingWithClient } from "./qualifyRepresentativeOnboardingWithClient";

import { returnRepresentativeOnboardingForCompletionWithClient } from "./returnRepresentativeOnboardingForCompletionWithClient";

import { declineRepresentativeOnboardingWithClient } from "./declineRepresentativeOnboardingWithClient";

/**
 * Application-facing lifecycle commands are transaction-wrapped.
 *
 * STATUS MUTATION + TRANSITION HISTORY = ONE ATOMIC ACT
 *
 * The *WithClient functions remain internal composition primitives.
 */

export async function submitRepresentativeOnboarding(params: {
  client: RepresentativeOnboardingLifecycleTransactionRunner;
  intakeId: string;
  submission: RepresentativeOnboardingSubmission;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingLifecycleTransaction(params.client, (tx) =>
    submitRepresentativeOnboardingWithClient({
      client: tx,
      intakeId: params.intakeId,
      submission: params.submission,
      occurredAt: params.occurredAt,
    }),
  );
}

export async function beginRepresentativeOnboardingReview(params: {
  client: RepresentativeOnboardingLifecycleTransactionRunner;
  intakeId: string;
  actorUserId: string;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingLifecycleTransaction(params.client, (tx) =>
    beginRepresentativeOnboardingReviewWithClient({
      client: tx,
      intakeId: params.intakeId,
      actorUserId: params.actorUserId,
      occurredAt: params.occurredAt,
    }),
  );
}

export async function qualifyRepresentativeOnboarding(params: {
  client: RepresentativeOnboardingLifecycleTransactionRunner;
  intakeId: string;
  actorUserId: string;
  internalNotes?: string | null;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingLifecycleTransaction(params.client, (tx) =>
    qualifyRepresentativeOnboardingWithClient({
      client: tx,
      intakeId: params.intakeId,
      actorUserId: params.actorUserId,
      internalNotes: params.internalNotes,
      occurredAt: params.occurredAt,
    }),
  );
}

export async function returnRepresentativeOnboardingForCompletion(params: {
  client: RepresentativeOnboardingLifecycleTransactionRunner;
  intakeId: string;
  actorUserId: string;
  reason: string;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingLifecycleTransaction(params.client, (tx) =>
    returnRepresentativeOnboardingForCompletionWithClient({
      client: tx,
      intakeId: params.intakeId,
      actorUserId: params.actorUserId,
      reason: params.reason,
      occurredAt: params.occurredAt,
    }),
  );
}

export async function declineRepresentativeOnboarding(params: {
  client: RepresentativeOnboardingLifecycleTransactionRunner;
  intakeId: string;
  actorUserId: string;
  reason: string;
  occurredAt?: Date;
}) {
  return runRepresentativeOnboardingLifecycleTransaction(params.client, (tx) =>
    declineRepresentativeOnboardingWithClient({
      client: tx,
      intakeId: params.intakeId,
      actorUserId: params.actorUserId,
      reason: params.reason,
      occurredAt: params.occurredAt,
    }),
  );
}
