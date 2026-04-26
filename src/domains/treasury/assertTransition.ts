import {
  TREASURY_ACTION_STATUS,
  TREASURY_QUEUE_STATUS,
  type TreasuryActionStatus,
  type TreasuryQueueStatus,
} from './stateMachine'

const ACTION_TRANSITIONS: Record<
  TreasuryActionStatus,
  TreasuryActionStatus[]
> = {
  PENDING: [
    TREASURY_ACTION_STATUS.APPROVED,
    TREASURY_ACTION_STATUS.REJECTED,
    TREASURY_ACTION_STATUS.CANCELLED,
  ],

  APPROVED: [
    TREASURY_ACTION_STATUS.QUEUED,
  ],

  QUEUED: [
    TREASURY_ACTION_STATUS.EXECUTING,
    TREASURY_ACTION_STATUS.CANCELLED,
  ],

  EXECUTING: [
    TREASURY_ACTION_STATUS.EXECUTED,
    TREASURY_ACTION_STATUS.FAILED_RETRYABLE,
    TREASURY_ACTION_STATUS.FAILED_TERMINAL,
  ],

  EXECUTED: [],

  FAILED_RETRYABLE: [
    TREASURY_ACTION_STATUS.QUEUED,
    TREASURY_ACTION_STATUS.FAILED_TERMINAL,
  ],

  FAILED_TERMINAL: [],

  REJECTED: [],

  CANCELLED: [],
}

const QUEUE_TRANSITIONS: Record<
  TreasuryQueueStatus,
  TreasuryQueueStatus[]
> = {
  PENDING: [
    TREASURY_QUEUE_STATUS.CLAIMED,
    TREASURY_QUEUE_STATUS.CANCELLED,
  ],

  CLAIMED: [
    TREASURY_QUEUE_STATUS.EXECUTING,
    TREASURY_QUEUE_STATUS.FAILED_RETRYABLE,
  ],

  EXECUTING: [
    TREASURY_QUEUE_STATUS.EXECUTED,
    TREASURY_QUEUE_STATUS.FAILED_RETRYABLE,
    TREASURY_QUEUE_STATUS.FAILED_TERMINAL,
  ],

  EXECUTED: [],

  FAILED_RETRYABLE: [
    TREASURY_QUEUE_STATUS.PENDING,
    TREASURY_QUEUE_STATUS.FAILED_TERMINAL,
  ],

  FAILED_TERMINAL: [],

  CANCELLED: [],
}

export function assertTreasuryActionTransition(
  from: TreasuryActionStatus,
  to: TreasuryActionStatus
) {
  const allowed = ACTION_TRANSITIONS[from] ?? []

  if (!allowed.includes(to)) {
    throw new Error(
      `[TREASURY_ACTION_TRANSITION_INVALID] ${from} -> ${to}`
    )
  }
}

export function assertTreasuryQueueTransition(
  from: TreasuryQueueStatus,
  to: TreasuryQueueStatus
) {
  const allowed = QUEUE_TRANSITIONS[from] ?? []

  if (!allowed.includes(to)) {
    throw new Error(
      `[TREASURY_QUEUE_TRANSITION_INVALID] ${from} -> ${to}`
    )
  }
}
