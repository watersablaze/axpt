// app/admin/control-center/ControlCenterShell.tsx

import styles from "./control-center.module.css"
import ExecutionPanel from "@/components/panels/ExecutionPanel"
import TreasuryPanel from "@/components/panels/TreasuryPanel"
import WalletPanel from "@/components/panels/WalletPanel"
import SpinePanel from "@/components/panels/SpinePanel"
import ETKPanel from "@/components/panels/ETKPanel"
import SystemHealthPanel from "@/components/panels/SystemHealthPanel"
import ActionPanel from "@/components/panels/ActionPanel"
import TimelinePanel from "@/components/panels/TimelinePanel"

export function ControlCenterShell() {
  return (
    <div className={styles.grid}>
      
      {/* LEFT COLUMN — SYSTEM STATE */}
      <div className={styles.left}>
        <SystemHealthPanel />
        <ETKPanel />
        <SpinePanel />
      </div>

      {/* CENTER — EXECUTION REALITY */}
      <div className={styles.center}>
        <ExecutionPanel />
        <TimelinePanel />
      </div>

      {/* RIGHT — DOMAIN OPERATIONS */}
      <div className={styles.right}>
        <TreasuryPanel />
        <WalletPanel />
        <ActionPanel />
      </div>

    </div>
  )
}