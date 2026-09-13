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
    "function renderRoomGovernance()"
  ),
  "ROOM_GOVERNANCE_RENDERER_MISSING"
)

assert(
  source.includes(
    "Room Governance"
  ),
  "ROOM_GOVERNANCE_LABEL_MISSING"
)

assert(
  source.includes(
    "Link Institutional Context"
  ) &&
    source.includes(
      "linkOperationalContext()"
    ),
  "ROOM_GOVERNANCE_LINK_CONTROL_MISSING"
)

assert(
  source.includes(
    'conversationArchived\n                ? "reactivate"\n                : "archive"'
  ),
  "ROOM_GOVERNANCE_LIFECYCLE_CONTROL_MISSING"
)

assert(
  source.includes(
    "canManageConversations"
  ),
  "ROOM_GOVERNANCE_PERMISSION_GATE_MISSING"
)

const lifecycleStart =
  source.indexOf(
    "async function changeConversationStatus("
  )

const sendMessageStart =
  source.indexOf(
    "async function sendMessage()",
    lifecycleStart
  )

assert(
  lifecycleStart !== -1 &&
    sendMessageStart !== -1,
  "ROOM_GOVERNANCE_LIFECYCLE_RANGE_MISSING"
)

const lifecycleHandler =
  source.slice(
    lifecycleStart,
    sendMessageStart
  )

const lifecycleReload =
  lifecycleHandler.indexOf(
    "await loadConversations()"
  )

const lifecycleLinkReset =
  lifecycleHandler.indexOf(
    "setLinkContextOpen("
  )

assert(
  lifecycleReload !== -1 &&
    lifecycleLinkReset !== -1 &&
    lifecycleLinkReset > lifecycleReload,
  "ROOM_GOVERNANCE_TRANSIENT_STATE_NOT_SETTLED"
)

assert(
  !lifecycleHandler.includes(
    "setResponsiveContextOpen("
  ),
  "ROOM_GOVERNANCE_LIFECYCLE_CLOSES_CONTEXT_SURFACE"
)

assert(
  source.includes(
    "selectedConversation.operationalRoom"
  ) &&
    source.includes(
      "canManageConversations"
    ) &&
    source.includes(
      "!conversationArchived"
    ),
  "ROOM_GOVERNANCE_LINK_STATE_GATE_MISSING"
)

const responsiveDrawerStart =
  source.indexOf(
    'id="communications-responsive-context"'
  )

const desktopRailStart =
  source.indexOf(
    '<aside className="hidden w-[300px]'
  )

assert(
  responsiveDrawerStart !== -1 &&
    desktopRailStart !== -1,
  "ROOM_GOVERNANCE_CONTEXT_SURFACES_MISSING"
)

const responsiveDrawer =
  source.slice(
    responsiveDrawerStart,
    desktopRailStart
  )

const desktopRail =
  source.slice(
    desktopRailStart
  )

assert(
  responsiveDrawer.includes(
    "{renderRoomGovernance()}"
  ),
  "RESPONSIVE_ROOM_GOVERNANCE_MISSING"
)

assert(
  desktopRail.includes(
    "{renderRoomGovernance()}"
  ),
  "DESKTOP_ROOM_GOVERNANCE_MISSING"
)

/*
 * Center header should now contain identity and
 * responsive Context access only.
 */
const activeRoomStart =
  source.indexOf(
    '<section className="flex min-w-0 flex-1 flex-col">'
  )

const timelineStart =
  source.indexOf(
    '<div className="flex-1 overflow-y-auto px-5 py-5">',
    activeRoomStart
  )

assert(
  activeRoomStart !== -1 &&
    timelineStart !== -1,
  "ACTIVE_ROOM_HEADER_RANGE_MISSING"
)

const activeRoomHeader =
  source.slice(
    activeRoomStart,
    timelineStart
  )

assert(
  activeRoomHeader.includes(
    "Operational Room"
  ) &&
    activeRoomHeader.includes(
      "Context"
    ),
  "ACTIVE_ROOM_HEADER_IDENTITY_OR_CONTEXT_ACCESS_MISSING"
)

assert(
  !activeRoomHeader.includes(
    "Link Context"
  ) &&
    !activeRoomHeader.includes(
      "Attach Context"
    ),
  "ACTIVE_ROOM_HEADER_LINK_GOVERNANCE_REMAINS"
)

assert(
  !activeRoomHeader.includes(
    "changeConversationStatus("
  ),
  "ACTIVE_ROOM_HEADER_LIFECYCLE_GOVERNANCE_REMAINS"
)

console.log({
  governanceRendererPresent:
    true,

  linkContextAuthorityPreserved:
    true,

  lifecycleAuthorityPreserved:
    true,

  permissionGatePreserved:
    true,

  archivedLinkGatePreserved:
    true,

  responsiveGovernanceMounted:
    true,

  desktopGovernanceMounted:
    true,

  centerHeaderGovernanceRemoved:
    true,

  centerHeaderContextAccessPreserved:
    true,
})
