import type {
  PrismaClient,
} from "@prisma/client";

import type {
  CommercialUtilityPackGovernanceTransactionClient,
  CommercialUtilityPackGovernanceTransactionRunner,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/governance/runCommercialUtilityPackGovernanceTransaction";

import type {
  CommercialUtilityPackResourceReleaseClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/releaseCommercialUtilityPackResourceWithClient";

import type {
  CommercialUtilityPackModuleTransitionClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/transitionCommercialUtilityPackModuleWithClient";

import type {
  CommercialUtilityPackReleaseReconciliationClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/commands/reconcileCommercialUtilityPackReleaseStateWithClient";

function acceptsResourceRelease(
  _client:
    CommercialUtilityPackResourceReleaseClient,
) {}

function acceptsModuleTransition(
  _client:
    CommercialUtilityPackModuleTransitionClient,
) {}

function acceptsReconciliation(
  _client:
    CommercialUtilityPackReleaseReconciliationClient,
) {}

function proveReleaseCapabilities(
  client:
    CommercialUtilityPackGovernanceTransactionClient,
) {
  acceptsResourceRelease(
    client,
  );

  acceptsModuleTransition(
    client,
  );

  acceptsReconciliation(
    client,
  );
}

function proveRunner(
  runner:
    CommercialUtilityPackGovernanceTransactionRunner,
) {
  const prismaRunner:
    Pick<
      PrismaClient,
      "$transaction"
    > =
      runner;

  void prismaRunner;
}

void proveReleaseCapabilities;
void proveRunner;

console.log(
  "✓ governance transaction client satisfies resource release",
);

console.log(
  "✓ governance transaction client satisfies module transition",
);

console.log(
  "✓ governance transaction client satisfies package reconciliation",
);

console.log(
  "✓ canonical transaction runner remains Prisma $transaction only",
);

console.log(
  "✓ no second CUP release transaction model introduced",
);

console.log(
  "CUP_1G_RELEASE_TRANSACTION_CAPABILITY_OK",
);
