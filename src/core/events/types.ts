export const EventTypes = {
  /*
  ─────────────────────────────
  TREASURY
  ─────────────────────────────
  */

  TREASURY_INFLOW: 'TREASURY_INFLOW',
  TREASURY_OUTFLOW: 'TREASURY_OUTFLOW',

  /*
  ─────────────────────────────
  ESCROW
  ─────────────────────────────
  */

  ESCROW_FUNDED: 'ESCROW_FUNDED',
  ESCROW_PARTIALLY_FUNDED:
    'ESCROW_PARTIALLY_FUNDED',

  ESCROW_RELEASED: 'ESCROW_RELEASED',
  ESCROW_LOCKED: 'ESCROW_LOCKED',
  ESCROW_MISMATCH: 'ESCROW_MISMATCH',
  ESCROW_SETTLED: 'ESCROW_SETTLED',

  /*
  ─────────────────────────────
  CASES
  ─────────────────────────────
  */

  CASE_CREATED: 'CASE_CREATED',
  CASE_FLAGGED: 'CASE_FLAGGED',

    /*
  ─────────────────────────────
  INCIDENTS
  ─────────────────────────────
  */

  
  INCIDENT_ACKNOWLEDGED:
    'INCIDENT_ACKNOWLEDGED',

  INCIDENT_RESOLVED: 
    'INCIDENT_RESOLVED',

  INCIDENT_REOPENED: 
    'INCIDENT_REOPENED',


  /*
  ─────────────────────────────
  DOSSIER
  ─────────────────────────────
  */

  DOSSIER_STATE_TRANSITIONED:
  'DOSSIER_STATE_TRANSITIONED',

  /*
  ─────────────────────────────
  SECURITY
  ─────────────────────────────
  */

  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACTION_REVERSED: 'ACTION_REVERSED',

  /*
  ─────────────────────────────
  GOVERNANCE
  ─────────────────────────────
  */

  GOVERNANCE_OVERRIDE:
    'GOVERNANCE_OVERRIDE',

  AUTHORITY_OVERRIDE:
    'AUTHORITY_OVERRIDE',

  /*
  ─────────────────────────────
  CHAIN
  ─────────────────────────────
  */

  CHAIN_SYNC_LAG: 'CHAIN_SYNC_LAG',
  CHAIN_RESTORED: 'CHAIN_RESTORED',

  /*
  ─────────────────────────────
  SYSTEM
  ─────────────────────────────
  */

  GATES_INITIALIZED:
    'GATES_INITIALIZED',

  ARTIFACTS_REQUIRED:
    'ARTIFACTS_REQUIRED',

  /*
  ─────────────────────────────
  TRANSACTIONS
  ─────────────────────────────
  */

  TRANSACTION_CREATED:
    'TRANSACTION_CREATED',

  TRANSACTION_APPROVED:
    'TRANSACTION_APPROVED',

  TRANSACTION_SETTLED:
    'TRANSACTION_SETTLED',

  /*
  ─────────────────────────────
  DOCUMENT ENGINE
  ─────────────────────────────
  */

  DOCUMENT_SIGNED:
    'DOCUMENT_SIGNED',

  DOCUMENT_REJECTED:
    'DOCUMENT_REJECTED',
} as const

export type EventType =
  (typeof EventTypes)[keyof typeof EventTypes]