'use client'

import { useEffect, useState } from 'react'

import styles from './control-center.module.css'

import type { ControlCenterSnapshot } from '@/components/panels/contracts/controlCenter'

import ExecutionPanel from '@/components/panels/ExecutionPanel'
import TreasuryPanel from '@/components/panels/TreasuryPanel'
import WalletPanel from '@/components/panels/WalletPanel'
import SpinePanel from '@/components/panels/SpinePanel'
import ETKPanel from '@/components/panels/ETKPanel'
import SystemHealthPanel from '@/components/panels/SystemHealthPanel'
import ActionPanel from '@/components/panels/ActionPanel'
import TimelinePanel from '@/components/panels/TimelinePanel'
import IntelligenceSummaryPanel from '@/components/panels/IntelligenceSummaryPanel'
import ActiveIncidentPanel from '@/components/panels/ActiveIncidentPanel'
import IncidentActionPanel from '@/components/panels/IncidentActionPanel'
import { useControlCenterOperationalState } from '@/hooks/useControlCenterOperationalState'
import DossierSnapshotPanel from '@/components/panels/DossierSnapshotPanel'

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

  return (
    <div className={styles.grid}>
      <div className={styles.left}>
        <SystemHealthPanel
          data={snapshot.system}
          loading={loading}
        />

        <ETKPanel
          data={snapshot.authority}
        />

        <SpinePanel
          data={snapshot.governance}
        />
      </div>

      <div className={styles.center}>
      <ExecutionPanel
        data={snapshot.execution}
      />

      <DossierSnapshotPanel
        dossiers={operationalState.dossiers}
      />

      <ActiveIncidentPanel
        incidents={operationalState.incidents}
        onRefresh={operationalState.refreshOperationalState}
      />

      <IncidentActionPanel
        actions={operationalState.actions}
      />

      <IntelligenceSummaryPanel
        signals={operationalState.intelligence}
      />

        <TimelinePanel
          timestamp={snapshot.timestamp}
        />
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