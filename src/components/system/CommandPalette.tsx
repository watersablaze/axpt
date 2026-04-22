'use client'

import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEntity } from '@/lib/context/EntityContext'
import { toast } from 'sonner'
import SimulationModal from '@/components/system/SimulationModal'
import ScenarioComparisonPanel from '@/components/admin/treasury/ScenarioComparisonPanel'
import { ADMIN_NAV } from '@/components/admin/layout/AdminNavConfig'
import { toastWhy } from '@/lib/toasts/whyToast'

type AdminAction =
  | {
      type: 'PAUSE' | 'RESUME'
      scope: 'SYSTEM'
    }
  | {
      type: 'PAUSE_ASSETS' | 'RESUME_ASSETS'
      scope: 'ASSET'
      targets?: string[] | 'ALL'
      exclude?: string[]
      requiresSelection?: boolean
    }
  | {
      type: 'PAUSE_LAYER' | 'RESUME_LAYER'
      scope: 'SYSTEM'
      pausedLayers: string[]
    }
  | {
      type: 'RUN_SYNC'
      scope: 'SYSTEM'
    }

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [simulationData, setSimulationData] = useState<any | null>(null)
  const [scenarioData, setScenarioData] = useState<any | null>(null)

  const router = useRouter()
  const { entity } = useEntity()

  // ⌘ + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  async function handlePauseResponse(res: Response) {
    const json = await res.json()

    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Action failed')
      return false
    }

    if (!json.changed) {
      toast.message(json.message ?? 'No change')
    } else {
      toast.success(json.message ?? 'State updated')
    }

    return true
  }

  async function ensureSystemHealthy() {
    const res = await fetch('/api/admin/system/status')
    const json = await res.json()

    if (!json.ok) return false

    const health = json.data?.health ?? json.data

    if (health?.state !== 'HEALTHY') {
      toast.error(`System ${health?.state ?? 'UNKNOWN'}: ${health?.reason ?? ''}`)
      return false
    }

    return true
  }

  async function runAction(action: AdminAction) {
    if ('requiresSelection' in action && action.requiresSelection && entity.assets.length === 0) {
      toast.error('No targets selected')
      return
    }

    switch (action.type) {
      // ---------------- SYSTEM ----------------
      case 'PAUSE': {
        if (!(await ensureSystemHealthy())) return

        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            globalPaused: true,
            reason: 'Paused from command palette',
          }),
        })

        await handlePauseResponse(res)
        break
      }

      case 'RESUME': {
        if (!(await ensureSystemHealthy())) return

        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            globalPaused: false,
            pausedAssets: [],
            pausedLayers: [],
            reason: null,
          }),
        })

        await handlePauseResponse(res)
        break
      }

      // ---------------- ASSETS ----------------
      case 'PAUSE_ASSETS': {
        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targets: action.targets,
            exclude: action.exclude,
            reason:
              action.targets === 'ALL'
                ? 'All assets restricted'
                : `Assets restricted: ${(action.targets ?? []).join(', ')}`,
          }),
        })

        await handlePauseResponse(res)
        break
      }

      case 'RESUME_ASSETS': {
        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pausedAssets: [],
            reason: null,
          }),
        })

        await handlePauseResponse(res)
        break
      }

      // ---------------- LAYERS ----------------
      case 'PAUSE_LAYER': {
        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pausedLayers: action.pausedLayers,
            reason: `Layer restricted: ${action.pausedLayers.join(', ')}`,
          }),
        })

        await handlePauseResponse(res)
        break
      }

      case 'RESUME_LAYER': {
        const res = await fetch('/api/admin/treasury/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pausedLayers: [],
            reason: null,
          }),
        })

        await handlePauseResponse(res)
        break
      }

      // ---------------- SYNC ----------------
      case 'RUN_SYNC': {
        if (!(await ensureSystemHealthy())) return

        const res = await fetch('/api/admin/treasury/sync-chain', {
          method: 'POST',
        })

        const json = await res.json()

        if (!res.ok || !json.ok) {
          toast.error(json.error ?? 'Sync failed')
          return
        }

        toast.success(`Sync complete — inserted ${json.data?.inserted ?? 0}`)
        break
      }
    }

    setOpen(false)
  }

  // ---------------- INTENTS ----------------

  async function confirmExecution(intent: string, scenarioId?: string) {
    const res = await fetch('/api/admin/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, scenarioId }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      toast.error(data.error ?? 'Intent execution failed')
      return
    }

    toast.success(`Intent executed: ${intent}`)
    setScenarioData(null)
    setSimulationData(null)
    setOpen(false)
  }

  async function runIntent(intent: string) {
    const res = await fetch('/api/admin/intent/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent }),
    })

    const json = await res.json()

    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Scenario failed')
      return
    }

    setScenarioData(json)
    setOpen(false)
  }

  async function runPredictive() {
    const res = await fetch('/api/admin/treasury/predictive', {
      method: 'POST',
    })

    const json = await res.json()

    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Predictive failed')
      return
    }

    toast.success('Predictive engine complete')
    setOpen(false)
  }

  async function runAdaptiveIntent() {
    const res = await fetch('/api/admin/intent/adaptive', {
      method: 'POST',
    })

    const data = await res.json()

    if (!data.ok) {
      toast.error(data.error)
      return
    }

    if (data.why) {
      toastWhy(data.why)
    } else {
      toast.success(`Suggested: ${data.best.intent}`)
    }
    setOpen(false)
  }

  async function runAutonomousLoopCommand() {
    if (!(await ensureSystemHealthy())) return

    const res = await fetch('/api/admin/intent/autonomous-loop', {
      method: 'POST',
    })

    const json = await res.json()

    if (!res.ok || !json.ok) {
      toast.error(json.error ?? 'Autonomous loop failed')
      return
    }

    const data = json.data
    if (!data.executed) {
      toast.message(
        `Autonomy blocked: ${data.decision?.reason ?? 'no reason provided'}`
      )
      setOpen(false)
      return
    }

    if (data.decision?.why) {
      toastWhy(data.decision.why)
    } else {
      toast.success(
        `Autonomous execution: ${data.decision?.intent ?? 'unknown'} / ${data.decision?.scenarioId ?? 'unknown'}`
      )
    }
    setOpen(false)
  }

  // ---------------- UI ----------------

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        className="fixed top-20 left-1/2 -translate-x-1/2 w-[600px] bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl"
      >
        <Command.Input
          placeholder="Type a command..."
          className="w-full p-4 bg-transparent outline-none border-b border-neutral-800"
        />

        <Command.List className="max-h-[400px] overflow-auto">
          <Command.Empty>No results found.</Command.Empty>

          {/* NAV */}
          <Command.Group heading="Navigation">
            {ADMIN_NAV.map((item) => (
              <Command.Item
                key={item.href}
                onSelect={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
              >
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          {/* SYSTEM */}
          <Command.Group heading="System Control">
            <Command.Item onSelect={() => runAction({ type: 'PAUSE', scope: 'SYSTEM' })}>
              Pause System
            </Command.Item>

            <Command.Item onSelect={() => runAction({ type: 'RESUME', scope: 'SYSTEM' })}>
              Resume System
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAction({
                  type: 'PAUSE_LAYER',
                  scope: 'SYSTEM',
                  pausedLayers: ['MIRROR'],
                })
              }
            >
              Restrict Mirror Layer
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAction({
                  type: 'RESUME_LAYER',
                  scope: 'SYSTEM',
                  pausedLayers: [],
                })
              }
            >
              Resume Mirror Layer
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Context">
            {entity.assets.length > 0 ? (
              <Command.Item
                onSelect={() =>
                  runAction({
                    type: 'PAUSE_ASSETS',
                    scope: 'ASSET',
                    targets: entity.assets,
                  })
                }
              >
                Restrict Selected Assets ({entity.assets.join(', ')})
              </Command.Item>
            ) : (
              <Command.Item disabled>No assets selected</Command.Item>
            )}
          </Command.Group>

          {/* INTENTS */}
          <Command.Group heading="Intelligence">
            <Command.Item onSelect={() => runPredictive()}>
              Run Predictive Engine
            </Command.Item>

            <Command.Item onSelect={() => runAdaptiveIntent()}>
              Run Adaptive Intent
            </Command.Item>

            <Command.Item onSelect={() => runAutonomousLoopCommand()}>
              Run Autonomous Loop
            </Command.Item>

            <Command.Item onSelect={() => runIntent('STABILIZE_SYSTEM')}>
              Stabilize System
            </Command.Item>

            <Command.Item onSelect={() => runIntent('PREPARE_SETTLEMENT')}>
              Prepare Settlement
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>

      {scenarioData && (
        <ScenarioComparisonPanel
          intent={scenarioData.intent}
          scenarios={scenarioData.scenarios}
          best={scenarioData.best}
          onSelect={(id) => confirmExecution(scenarioData.intent, id)}
        />
      )}

      {simulationData && (
        <SimulationModal
          data={simulationData}
          onConfirm={() => confirmExecution(simulationData.intent)}
          onCancel={() => setSimulationData(null)}
        />
      )}
    </>
  )
}
