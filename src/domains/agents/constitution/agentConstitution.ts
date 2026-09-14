import {
  AGENT_AUTHORITY_DOCTRINE,
} from "./authorityDoctrine";

import {
  AGENT_PROVENANCE_DOCTRINE,
} from "./provenanceDoctrine";

export const AXPT_AGENT_CONSTITUTION_VERSION =
  "1.0.0" as const;

export const AGENT_IDENTITY_DOCTRINE = Object.freeze({
  IDENTITY_NOT_AUTHORITY: Object.freeze({
    code: "IDENTITY_NOT_AUTHORITY",
    statement:
      "Agent identity does not itself confer capability, authority, standing, ownership or institutional representation.",
  }),

  PRINCIPAL_REQUIRED: Object.freeze({
    code: "PRINCIPAL_REQUIRED",
    statement:
      "Every institutional agent must have an identifiable principal.",
  }),

  AUTHORITY_REVOCABLE_WITHOUT_IDENTITY_DESTRUCTION:
    Object.freeze({
      code:
        "AUTHORITY_REVOCABLE_WITHOUT_IDENTITY_DESTRUCTION",
      statement:
        "Authority may be revoked without deleting or destroying the agent identity.",
    }),

  RUNTIME_NOT_AGENT_IDENTITY: Object.freeze({
    code: "RUNTIME_NOT_AGENT_IDENTITY",
    statement:
      "The cognition provider and model runtime are replaceable bindings, not the agent identity.",
  }),

  INSTITUTIONAL_MEMORY_NOT_RAW_MODEL_MEMORY:
    Object.freeze({
      code:
        "INSTITUTIONAL_MEMORY_NOT_RAW_MODEL_MEMORY",
      statement:
        "Institutional memory is governed information and cannot be created solely through raw model retention or ingestion.",
    }),
});

export const AXPT_AGENT_CONSTITUTION = Object.freeze({
  ...AGENT_IDENTITY_DOCTRINE,
  ...AGENT_AUTHORITY_DOCTRINE,
  ...AGENT_PROVENANCE_DOCTRINE,
});

export type AgentConstitutionDoctrineCode =
  keyof typeof AXPT_AGENT_CONSTITUTION;

export type AgentConstitutionDoctrine =
  (typeof AXPT_AGENT_CONSTITUTION)[AgentConstitutionDoctrineCode];

export function assertAxptAgentConstitution(): void {
  const entries =
    Object.entries(AXPT_AGENT_CONSTITUTION);

  if (entries.length !== 10) {
    throw new Error(
      `[AGENT_CONSTITUTION_DOCTRINE_COUNT_INVALID] expected=10 actual=${entries.length}`,
    );
  }

  const codes =
    entries.map(([, doctrine]) => doctrine.code);

  if (new Set(codes).size !== codes.length) {
    throw new Error(
      "[AGENT_CONSTITUTION_DOCTRINE_CODE_DUPLICATE]",
    );
  }

  for (const [key, doctrine] of entries) {
    if (key !== doctrine.code) {
      throw new Error(
        `[AGENT_CONSTITUTION_DOCTRINE_CODE_MISMATCH] key=${key} code=${doctrine.code}`,
      );
    }

    if (!doctrine.statement.trim()) {
      throw new Error(
        `[AGENT_CONSTITUTION_DOCTRINE_STATEMENT_REQUIRED] ${doctrine.code}`,
      );
    }
  }
}
