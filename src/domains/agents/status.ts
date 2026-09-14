export const AGENT_STATUS = Object.freeze({
  PROVISIONAL: "PROVISIONAL",
  ACTIVE: "ACTIVE",
  RESTRICTED: "RESTRICTED",
  SUSPENDED: "SUSPENDED",
  REVOKED: "REVOKED",
});

export type AgentStatus =
  (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export const AGENT_STATUS_VALUES =
  Object.freeze(Object.values(AGENT_STATUS));

const AGENT_STATUS_TRANSITIONS: Readonly<
  Record<AgentStatus, readonly AgentStatus[]>
> = Object.freeze({
  [AGENT_STATUS.PROVISIONAL]: Object.freeze([
    AGENT_STATUS.ACTIVE,
    AGENT_STATUS.REVOKED,
  ]),

  [AGENT_STATUS.ACTIVE]: Object.freeze([
    AGENT_STATUS.RESTRICTED,
    AGENT_STATUS.SUSPENDED,
    AGENT_STATUS.REVOKED,
  ]),

  [AGENT_STATUS.RESTRICTED]: Object.freeze([
    AGENT_STATUS.ACTIVE,
    AGENT_STATUS.SUSPENDED,
    AGENT_STATUS.REVOKED,
  ]),

  [AGENT_STATUS.SUSPENDED]: Object.freeze([
    AGENT_STATUS.ACTIVE,
    AGENT_STATUS.RESTRICTED,
    AGENT_STATUS.REVOKED,
  ]),

  [AGENT_STATUS.REVOKED]: Object.freeze([]),
});

export function isAgentStatus(
  value: string,
): value is AgentStatus {
  return (
    AGENT_STATUS_VALUES as readonly string[]
  ).includes(value);
}

export function canTransitionAgentStatus(
  from: AgentStatus,
  to: AgentStatus,
): boolean {
  return AGENT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertAgentStatusTransition(
  from: AgentStatus,
  to: AgentStatus,
): void {
  if (!canTransitionAgentStatus(from, to)) {
    throw new Error(
      `[AGENT_STATUS_TRANSITION_INVALID] ${from} -> ${to}`,
    );
  }
}
