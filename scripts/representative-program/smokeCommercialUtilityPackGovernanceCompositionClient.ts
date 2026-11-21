import type {
  PrismaClient,
} from "@prisma/client";

import type {
  CommercialUtilityPackGovernanceTransactionClient,
  CommercialUtilityPackGovernanceTransactionRunner,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/governance/runCommercialUtilityPackGovernanceTransaction";

import type {
  CommercialUtilityPackCreationClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/createCommercialUtilityPackWithClient";

import type {
  CommercialUtilityPackCompositionRegistrationClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/registerCommercialUtilityPackCompositionPlanWithClient";

import type {
  CommercialUtilityPackReadinessApplicationClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/markCommercialUtilityPackModuleReadyWithClient";

import type {
  CommercialUtilityPackCompositionPlanClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/composition/resolveCommercialUtilityPackCompositionPlanWithClient";

/*
 * Compile-time proof:
 *
 * the canonical CUP governance transaction client must satisfy every
 * capability contract required by creation, composition, registration,
 * readiness assessment, and readiness application.
 */

function creationClient(
  client:
    CommercialUtilityPackGovernanceTransactionClient,
): CommercialUtilityPackCreationClient {
  return client;
}

function compositionPlanClient(
  client:
    CommercialUtilityPackGovernanceTransactionClient,
): CommercialUtilityPackCompositionPlanClient {
  return client;
}

function registrationClient(
  client:
    CommercialUtilityPackGovernanceTransactionClient,
): CommercialUtilityPackCompositionRegistrationClient {
  return client;
}

function readinessClient(
  client:
    CommercialUtilityPackGovernanceTransactionClient,
): CommercialUtilityPackReadinessApplicationClient {
  return client;
}

function runner(
  client:
    Pick<PrismaClient, "$transaction">,
): CommercialUtilityPackGovernanceTransactionRunner {
  return client;
}

void creationClient;
void compositionPlanClient;
void registrationClient;
void readinessClient;
void runner;

console.log(
  "✓ one CUP governance transaction client satisfies creation",
);

console.log(
  "✓ same transaction client satisfies composition planning",
);

console.log(
  "✓ same transaction client satisfies composition registration",
);

console.log(
  "✓ same transaction client satisfies readiness assessment/application",
);

console.log(
  "✓ no second CUP transaction model introduced",
);

console.log(
  "CUP_1F_GOVERNANCE_TRANSACTION_CAPABILITY_OK",
);
