'use client'

import { useEffect, useRef, useState } from 'react'

import styles from './control-center.module.css'

import type { ControlCenterSnapshot } from '@/components/panels/contracts/controlCenter'

import ExecutionPanel from '@/components/panels/ExecutionPanel'
import TreasuryPanel from '@/components/panels/TreasuryPanel'
import WalletPanel from '@/components/panels/WalletPanel'
import SpinePanel from '@/components/panels/SpinePanel'
import ETKPanel from '@/components/panels/ETKPanel'
import SystemHealthPanel from '@/components/panels/SystemHealthPanel'
import ActionPanel from '@/components/panels/ActionPanel'
import IntelligenceSummaryPanel from '@/components/panels/IntelligenceSummaryPanel'
import ActiveIncidentPanel from '@/components/panels/ActiveIncidentPanel'
import IncidentActionPanel from '@/components/panels/IncidentActionPanel'
import { useControlCenterOperationalState } from '@/hooks/useControlCenterOperationalState'
import DossierSnapshotPanel from '@/components/panels/DossierSnapshotPanel'
import OperatorIdentityPanel from '@/components/panels/OperatorIdentityPanel'

import OperatorActivityLedgerPanel
  from '@/components/panels/OperatorActivityLedgerPanel'

import OperatorAuthorityMatrixPanel
  from '@/components/panels/OperatorAuthorityMatrixPanel'

import ControlCenterModeSwitcher, {
  type ControlCenterMode,
} from '@/components/panels/ControlCenterModeSwitcher'

import OpportunityIntakePanel
  from '@/components/panels/OpportunityIntakePanel'

import OpportunityQueuePanel
  from '@/components/panels/OpportunityQueuePanel'

import DossierWorkspacePanel 
  from '@/components/panels/workspace/DossierWorkspacePanel'

const EMPTY_SNAPSHOT: ControlCenterSnapshot = {
  timestamp: 0,

  system: {
    health: 0,
    drift: 0,
    stability: 0,
    status: 'WATCH',
  },

  execution: {
    pending: 0,
    successRate: 0,
    activeJobs: 0,
  },

  treasury: {
    pendingActions: 0,
    queuedExecutions: 0,
    failedExecutions: 0,
  },

  reconciliation: {
    driftScore: 0,
    anomalies: 0,
    lastSync: null,
  },

  chain: {
    network: 'UNKNOWN',
    latestIndexedBlock: null,
    lagSeconds: null,
  },

  governance: {
    riskScore: 0,
    activeLocks: 0,
    riskLevel: 'LOW',
  },

  authority: {
    mode: 'SHADOW',
    lastDecision: null,
  },
}

export function ControlCenterShell() {
  const [mode, setMode] =
    useState<ControlCenterMode>('COMMAND')
  
  const [snapshot, setSnapshot] =
    useState<ControlCenterSnapshot>(
      EMPTY_SNAPSHOT
    )

  const [loading, setLoading] =
    useState(true)

  async function loadSnapshot() {
    try {
      const res = await fetch(
        '/api/admin/control-center',
        {
          cache: 'no-store',
        }
      )

      const json = await res.json()

      if (json?.snapshot) {
        setSnapshot(json.snapshot)
      }
    } catch (err) {
      console.error(
        '[CONTROL_CENTER_LOAD_FAILED]',
        err
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSnapshot()

    const interval = window.setInterval(() => {
      void loadSnapshot()
    }, 5000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const operationalState =
    useControlCenterOperationalState()

  const [focusedDossierId, setFocusedDossierId] =
    useState<string | null>(null)

  const workspaceRef =
    useRef<HTMLDivElement | null>(null)

  function openDossier(dossierId: string) {
    setFocusedDossierId(dossierId)
    setMode('EXECUTION')

    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <SystemHealthPanel
          data={snapshot.system}
          loading={loading}
        />

        <ActiveIncidentPanel
          incidents={operationalState.incidents}
          onRefresh={
            operationalState.refreshOperationalState
          }
        />

        <IntelligenceSummaryPanel
          signals={operationalState.intelligence}
        />

        <ETKPanel
          data={snapshot.authority}
        />

        <SpinePanel
          data={snapshot.governance}
        />
      </div>

      <div className={styles.center}>
        <ControlCenterModeSwitcher
          mode={mode}
          onChange={setMode}
        />

        {mode === 'COMMAND' ? (
          <>
            <ExecutionPanel
              data={snapshot.execution}
            />

            <OpportunityIntakePanel />

            <OpportunityQueuePanel
              onPromoted={
                operationalState.refreshOperationalState
              }
              selectedDossierId={focusedDossierId}
              onOpenDossier={openDossier}
            />

            <DossierSnapshotPanel
              dossiers={operationalState.dossiers}
              onRefresh={
                operationalState.refreshOperationalState
              }
              onFocusDossier={openDossier}
            />
          </>
        ) : null}

        {mode === 'OPERATOR' ? (
          <>
            <OperatorIdentityPanel
              operator={operationalState.operatorIdentity}
            />

            <OperatorAuthorityMatrixPanel
              operator={operationalState.operatorIdentity}
            />

            <OperatorActivityLedgerPanel
              activity={
                operationalState.operatorActivity
              }
            />

            <IncidentActionPanel
              actions={operationalState.actions}
            />
          </>
        ) : null}

        {mode === 'EXECUTION' ? (
          <>
            {focusedDossierId ? (
              <div ref={workspaceRef}>
                <DossierWorkspacePanel
                  dossierId={focusedDossierId}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-500">
                Select a dossier from Command mode to open the Flight Deck.
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className={styles.right}>
        <TreasuryPanel
          data={snapshot.treasury}
        />

        <WalletPanel />

        <ActionPanel />
      </div>
    </div>
  )
}