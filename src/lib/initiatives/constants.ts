export const InitiativeStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  FUNDED: 'FUNDED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type InitiativeStatus = typeof InitiativeStatus[keyof typeof InitiativeStatus];