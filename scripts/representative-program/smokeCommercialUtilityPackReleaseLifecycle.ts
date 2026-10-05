import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RELEASE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  assertCommercialUtilityPackModuleTransition,
  assertCommercialUtilityPackResourceTransition,
  canTransitionCommercialUtilityPackModule,
  canTransitionCommercialUtilityPackResource,
  deriveCommercialUtilityPackReleaseState,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack/contracts";

function main() {
  assert.equal(
    canTransitionCommercialUtilityPackModule(
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.WITHHELD,
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
    ),
    true,
  );

  assert.equal(
    canTransitionCommercialUtilityPackModule(
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
    ),
    true,
  );

  assert.equal(
    canTransitionCommercialUtilityPackModule(
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.WITHHELD,
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
    ),
    false,
  );

  assert.equal(
    canTransitionCommercialUtilityPackModule(
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
    ),
    false,
  );

  /*
   * Exact target replay is legal and will be handled
   * idempotently by the command layer.
   */
  assert.equal(
    canTransitionCommercialUtilityPackModule(
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
    ),
    true,
  );

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackModuleTransition({
      from:
        COMMERCIAL_UTILITY_PACK_MODULE_STATE.WITHHELD,
      to:
        COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
    }),
  );

  assert.throws(
    () =>
      assertCommercialUtilityPackModuleTransition({
        from:
          COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
        to:
          COMMERCIAL_UTILITY_PACK_MODULE_STATE.WITHHELD,
      }),
    /CUP_MODULE_TRANSITION_INVALID/,
  );

  assert.equal(
    canTransitionCommercialUtilityPackResource(
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHHELD,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
    ),
    true,
  );

  assert.equal(
    canTransitionCommercialUtilityPackResource(
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.SUPERSEDED,
    ),
    true,
  );

  assert.equal(
    canTransitionCommercialUtilityPackResource(
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHDRAWN,
    ),
    true,
  );

  assert.equal(
    canTransitionCommercialUtilityPackResource(
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHHELD,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHDRAWN,
    ),
    false,
  );

  assert.equal(
    canTransitionCommercialUtilityPackResource(
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.SUPERSEDED,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
    ),
    false,
  );

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackResourceTransition({
      from:
        COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHHELD,
      to:
        COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
    }),
  );

  assert.throws(
    () =>
      assertCommercialUtilityPackResourceTransition({
        from:
          COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHDRAWN,
        to:
          COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
      }),
    /CUP_RESOURCE_TRANSITION_INVALID/,
  );

  assert.equal(
    deriveCommercialUtilityPackReleaseState([
      "WITHHELD",
      "WITHHELD",
      "WITHHELD",
      "WITHHELD",
    ]),
    COMMERCIAL_UTILITY_PACK_RELEASE_STATE.WITHHELD,
  );

  assert.equal(
    deriveCommercialUtilityPackReleaseState([
      "READY",
      "WITHHELD",
      "WITHHELD",
      "WITHHELD",
    ]),
    COMMERCIAL_UTILITY_PACK_RELEASE_STATE.PARTIAL,
  );

  assert.equal(
    deriveCommercialUtilityPackReleaseState([
      "RELEASED",
      "READY",
      "RELEASED",
      "WITHHELD",
    ]),
    COMMERCIAL_UTILITY_PACK_RELEASE_STATE.PARTIAL,
  );

  assert.equal(
    deriveCommercialUtilityPackReleaseState([
      "RELEASED",
      "RELEASED",
      "RELEASED",
      "RELEASED",
    ]),
    COMMERCIAL_UTILITY_PACK_RELEASE_STATE.RELEASED,
  );

  assert.throws(
    () =>
      deriveCommercialUtilityPackReleaseState([
        "WITHHELD",
      ]),
    /CUP_RELEASE_STATE_MODULE_CARDINALITY_INVALID/,
  );

  console.log(
    "✓ module lifecycle WITHHELD → READY → RELEASED",
  );

  console.log(
    "✓ module forward-skip and reversal prohibited",
  );

  console.log(
    "✓ resource lifecycle WITHHELD → RELEASED → terminal disposition",
  );

  console.log(
    "✓ exact-target replay remains legal",
  );

  console.log(
    "✓ package release-state derivation certified",
  );

  console.log(
    "CUP_1D_RELEASE_LIFECYCLE_OK",
  );
}

main();
