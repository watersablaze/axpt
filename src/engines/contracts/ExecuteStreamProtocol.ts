export type WarRoomMessage =
  | {
      type: "SNAPSHOT"
      version: string
      payload: any
    }
  | {
      type: "SNAPSHOT_BLOCKED"
      version: string
      reason: string
    }
  | {
      type: "EXECUTION_EVENT"
      version: string
      payload: any
    }