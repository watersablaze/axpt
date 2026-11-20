import type { RepresentativeProgramParticipantCreationClient } from "../../commands/createRepresentativeProgramParticipantWithClient";

import type { RepresentativeOnboardingPersistenceClient } from "../persistence";

export type RepresentativeOnboardingTransactionClient =
  RepresentativeOnboardingPersistenceClient &
    RepresentativeProgramParticipantCreationClient;

export type RepresentativeOnboardingTransactionRunner = Readonly<{
  $transaction<T>(
    operation: (tx: RepresentativeOnboardingTransactionClient) => Promise<T>,
  ): Promise<T>;
}>;

export async function runRepresentativeOnboardingTransaction<T>(
  client: RepresentativeOnboardingTransactionRunner,
  operation: (tx: RepresentativeOnboardingTransactionClient) => Promise<T>,
): Promise<T> {
  return client.$transaction(operation);
}

/**
 * Ordinary onboarding lifecycle mutations need only the onboarding
 * persistence delegates.
 *
 * This keeps the application-facing transaction boundary narrower
 * than Program admission, which additionally needs the participant
 * and docket allocation capabilities.
 */
export type RepresentativeOnboardingLifecycleTransactionClient =
  RepresentativeOnboardingPersistenceClient;

export type RepresentativeOnboardingLifecycleTransactionRunner = Readonly<{
  $transaction<T>(
    operation: (
      tx: RepresentativeOnboardingLifecycleTransactionClient,
    ) => Promise<T>,
  ): Promise<T>;
}>;

export async function runRepresentativeOnboardingLifecycleTransaction<T>(
  client: RepresentativeOnboardingLifecycleTransactionRunner,
  operation: (
    tx: RepresentativeOnboardingLifecycleTransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(operation);
}
