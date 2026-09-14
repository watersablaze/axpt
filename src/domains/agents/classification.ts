export const AGENT_CLASS = Object.freeze({
  INSTITUTIONAL_INTELLIGENCE:
    "INSTITUTIONAL_INTELLIGENCE",

  SPECIALIST:
    "SPECIALIST",

  SENTINEL:
    "SENTINEL",

  COORDINATOR:
    "COORDINATOR",

  EXECUTION:
    "EXECUTION",
});

export type AgentClass =
  (typeof AGENT_CLASS)[keyof typeof AGENT_CLASS];

export const AGENT_CLASS_VALUES =
  Object.freeze(Object.values(AGENT_CLASS));

export function isAgentClass(
  value: string,
): value is AgentClass {
  return (
    AGENT_CLASS_VALUES as readonly string[]
  ).includes(value);
}
