import assert from "node:assert/strict";

import {
  AGENT_AUTHORITY_DOCTRINE,
  AGENT_CLASS,
  AGENT_CLASS_VALUES,
  AGENT_PROVENANCE_DOCTRINE,
  AGENT_STATUS,
  AGENT_STATUS_VALUES,
  AXPT_AGENT_CONSTITUTION,
  AXPT_AGENT_CONSTITUTION_VERSION,
  assertAgentStatusTransition,
  assertAxptAgentConstitution,
  canTransitionAgentStatus,
  isAgentClass,
  isAgentStatus,
} from "../../src/domains/agents";

const expectedDoctrineCodes = [
  "IDENTITY_NOT_AUTHORITY",
  "PRINCIPAL_REQUIRED",
  "AUTHORITY_REVOCABLE_WITHOUT_IDENTITY_DESTRUCTION",
  "RUNTIME_NOT_AGENT_IDENTITY",
  "INSTITUTIONAL_MEMORY_NOT_RAW_MODEL_MEMORY",
  "CAPABILITY_NOT_PERMISSION",
  "NO_IMPLIED_AUTHORITY",
  "COGNITIVE_AUTONOMY_NOT_EXECUTION_AUTONOMY",
  "MATERIAL_STATE_MUTATION_REQUIRES_GOVERNED_AUTHORITY",
  "MATERIAL_ACTION_REQUIRES_PROVENANCE",
];

assert.equal(
  AXPT_AGENT_CONSTITUTION_VERSION,
  "1.0.0",
);

assert.doesNotThrow(
  () => assertAxptAgentConstitution(),
);

assert.deepEqual(
  Object.keys(AXPT_AGENT_CONSTITUTION),
  expectedDoctrineCodes,
);

assert.equal(
  Object.keys(AGENT_AUTHORITY_DOCTRINE).length,
  4,
);

assert.equal(
  Object.keys(AGENT_PROVENANCE_DOCTRINE).length,
  1,
);

assert.deepEqual(
  AGENT_STATUS_VALUES,
  [
    AGENT_STATUS.PROVISIONAL,
    AGENT_STATUS.ACTIVE,
    AGENT_STATUS.RESTRICTED,
    AGENT_STATUS.SUSPENDED,
    AGENT_STATUS.REVOKED,
  ],
);

assert.equal(
  isAgentStatus("ACTIVE"),
  true,
);

assert.equal(
  isAgentStatus("EXECUTING"),
  false,
);

assert.equal(
  canTransitionAgentStatus(
    AGENT_STATUS.PROVISIONAL,
    AGENT_STATUS.ACTIVE,
  ),
  true,
);

assert.equal(
  canTransitionAgentStatus(
    AGENT_STATUS.ACTIVE,
    AGENT_STATUS.SUSPENDED,
  ),
  true,
);

assert.equal(
  canTransitionAgentStatus(
    AGENT_STATUS.REVOKED,
    AGENT_STATUS.ACTIVE,
  ),
  false,
);

assert.doesNotThrow(() =>
  assertAgentStatusTransition(
    AGENT_STATUS.RESTRICTED,
    AGENT_STATUS.ACTIVE,
  ),
);

assert.throws(
  () =>
    assertAgentStatusTransition(
      AGENT_STATUS.REVOKED,
      AGENT_STATUS.ACTIVE,
    ),

  /AGENT_STATUS_TRANSITION_INVALID/,
);

assert.deepEqual(
  AGENT_CLASS_VALUES,
  [
    AGENT_CLASS.INSTITUTIONAL_INTELLIGENCE,
    AGENT_CLASS.SPECIALIST,
    AGENT_CLASS.SENTINEL,
    AGENT_CLASS.COORDINATOR,
    AGENT_CLASS.EXECUTION,
  ],
);

assert.equal(
  isAgentClass("INSTITUTIONAL_INTELLIGENCE"),
  true,
);

assert.equal(
  isAgentClass("OPENAI_MODEL"),
  false,
);

console.log(
  "✓ AXPT Agent constitutional lock smoke passed",
);

console.log({
  constitutionVersion:
    AXPT_AGENT_CONSTITUTION_VERSION,

  doctrineCount:
    Object.keys(AXPT_AGENT_CONSTITUTION).length,

  statusCount:
    AGENT_STATUS_VALUES.length,

  classCount:
    AGENT_CLASS_VALUES.length,

  constitutionalLocks: {
    identityDoesNotGrantAuthority:
      true,

    capabilityDoesNotGrantPermission:
      true,

    runtimeDoesNotDefineIdentity:
      true,

    authorityMayBeRevokedWithoutDeletingIdentity:
      true,

    materialActionRequiresProvenance:
      true,

    materialMutationRequiresGovernedAuthority:
      true,
  },
});
