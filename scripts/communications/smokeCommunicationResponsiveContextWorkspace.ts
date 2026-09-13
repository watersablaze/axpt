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

const source =
  readFileSync(
    "src/components/admin/communications/CommunicationsWorkspace.tsx",
    "utf8"
  )

assert(
  source.includes(
    "responsiveContextOpen"
  ) &&
    source.includes(
      "setResponsiveContextOpen"
    ),
  "RESPONSIVE_CONTEXT_STATE_MISSING"
)

assert(
  source.includes(
    'aria-controls="communications-responsive-context"'
  ) &&
    source.includes(
      "xl:hidden"
    ),
  "RESPONSIVE_CONTEXT_TRIGGER_MISSING"
)

assert(
  source.includes(
    'id="communications-responsive-context"'
  ) &&
    source.includes(
      "absolute z-30 flex flex-col"
    ) &&
    source.includes(
      'right: 0'
    ) &&
    source.includes(
      'width: "320px"'
    ),
  "RESPONSIVE_CONTEXT_DRAWER_MISSING"
)

assert(
  source.includes(
    'className="absolute inset-0 z-20 bg-black/35 xl:hidden"'
  ),
  "RESPONSIVE_CONTEXT_BACKDROP_MISSING"
)

assert(
  source.includes(
    'width: "320px"'
  ) &&
    source.includes(
      '"calc(100% - 1.5rem)"'
    ) &&
    source.includes(
      'right: 0'
    ) &&
    source.includes(
      'left: "auto"'
    ),
  "RESPONSIVE_CONTEXT_GEOMETRY_INVALID"
)

assert(
  source.includes(
    "setResponsiveContextOpen(\n        false"
  ),
  "RESPONSIVE_CONTEXT_SELECTION_RESET_MISSING"
)

assert(
  source.includes(
    'hidden w-[300px] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950/35 xl:flex'
  ),
  "DESKTOP_CONTEXT_RAIL_NOT_PRESERVED"
)

const drawerStart =
  source.indexOf(
    'id="communications-responsive-context"'
  )

const desktopRailStart =
  source.indexOf(
    '<aside className="hidden w-[300px]'
  )

assert(
  drawerStart !== -1 &&
    desktopRailStart !== -1 &&
    drawerStart <
      desktopRailStart,
  "RESPONSIVE_CONTEXT_BOUNDARY_INVALID"
)

const drawerSource =
  source.slice(
    drawerStart,
    desktopRailStart
  )

for (const forbidden of [
  "linkOperationalContext()",
  "changeConversationStatus(",
  "sendMessage()",
  'method:\n',
]) {
  assert(
    !drawerSource.includes(
      forbidden
    ),
    `RESPONSIVE_CONTEXT_MUTATION_PRESENT:${forbidden}`
  )
}

assert(
  drawerSource.includes(
    "Institutional Context"
  ) &&
    drawerSource.includes(
      "Participants"
    ) &&
    drawerSource.includes(
      "Room context is informational."
    ),
  "RESPONSIVE_CONTEXT_INFORMATION_INCOMPLETE"
)

console.log({
  responsiveContextState:
    true,

  responsiveTriggerPresent:
    true,

  overlayDrawerPresent:
    true,

  overlayBackdropPresent:
    true,

  selectionChangeClosesDrawer:
    true,

  desktopRailPreserved:
    true,

  drawerReadOnly:
    true,

  institutionalContextPresented:
    true,

  participantsPresented:
    true,

  authorityBoundaryPresented:
    true,
})
