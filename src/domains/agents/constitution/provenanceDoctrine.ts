export const AGENT_PROVENANCE_DOCTRINE = Object.freeze({
  MATERIAL_ACTION_REQUIRES_PROVENANCE: Object.freeze({
    code: "MATERIAL_ACTION_REQUIRES_PROVENANCE",
    statement:
      "Every material agent action must preserve its actor, trigger, causal origin, authority basis, sources and institutional result.",
  }),
});

export type AgentProvenanceDoctrineCode =
  keyof typeof AGENT_PROVENANCE_DOCTRINE;
