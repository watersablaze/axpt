import { readFileSync } from "node:fs"

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      message
    )
  }
}

const shell =
  readFileSync(
    "src/components/admin/layout/OperationsShell.tsx",
    "utf8"
  )

const workspace =
  readFileSync(
    "src/components/admin/communications/CommunicationsWorkspace.tsx",
    "utf8"
  )

assert(
  shell.includes(
    'height: "100dvh"'
  ),
  "OPERATIONS_DYNAMIC_VIEWPORT_MISSING"
)

assert(
  !shell.includes(
    "h-screen"
  ) &&
    !shell.includes(
      "h-[100dvh]"
    ),
  "OPERATIONS_CLASS_BASED_VIEWPORT_HEIGHT_REMAINS"
)

assert(
  shell.includes(
    "min-h-0 min-w-0 flex-1 flex-col"
  ),
  "OPERATIONS_COLUMN_MIN_HEIGHT_MISSING"
)

assert(
  shell.includes(
    "min-h-0 flex-1 overflow-auto"
  ),
  "OPERATIONS_MAIN_MIN_HEIGHT_MISSING"
)

assert(
  workspace.includes(
    "relative flex h-full min-h-0 overflow-hidden"
  ),
  "COMMUNICATIONS_FILL_CONTRACT_MISSING"
)

assert(
  !workspace.includes(
    "h-[calc(100vh-9.5rem)]"
  ),
  "COMMUNICATIONS_MAGIC_VIEWPORT_CALC_REMAINS"
)

assert(
  !workspace.includes(
    'min-h-[560px]'
  ),
  "COMMUNICATIONS_FIXED_MIN_HEIGHT_REMAINS"
)

console.log({
  dynamicViewportShell: true,
  shellColumnMayShrink: true,
  mainMayShrink: true,
  mainScrollingPreserved: true,
  communicationsFillsAvailableSpace: true,
  communicationsMagicHeightRemoved: true,
})
