export const AGENT_AUTHORITY_DOCTRINE = Object.freeze({
  CAPABILITY_NOT_PERMISSION: Object.freeze({
    code: "CAPABILITY_NOT_PERMISSION",
    statement:
      "An agent capability describes what the agent can technically do. It does not grant institutional permission.",
  }),

  NO_IMPLIED_AUTHORITY: Object.freeze({
    code: "NO_IMPLIED_AUTHORITY",
    statement:
      "Absence of prohibition does not constitute authority. Every consequential action requires an explicit authority grant.",
  }),

  COGNITIVE_AUTONOMY_NOT_EXECUTION_AUTONOMY: Object.freeze({
    code: "COGNITIVE_AUTONOMY_NOT_EXECUTION_AUTONOMY",
    statement:
      "An agent may reason without possessing authority to mutate institutional state.",
  }),

  MATERIAL_STATE_MUTATION_REQUIRES_GOVERNED_AUTHORITY:
    Object.freeze({
      code:
        "MATERIAL_STATE_MUTATION_REQUIRES_GOVERNED_AUTHORITY",
      statement:
        "Every material institutional state mutation requires evaluated and governed authority.",
    }),
});

export type AgentAuthorityDoctrineCode =
  keyof typeof AGENT_AUTHORITY_DOCTRINE;
