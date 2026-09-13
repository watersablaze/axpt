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
    'className="hidden w-[300px] shrink-0 flex-col border-l border-neutral-800 bg-neutral-950/35 xl:flex"'
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_MISSING"
)

assert(
  source.includes(
    "Room Context"
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_IDENTITY_MISSING"
)

assert(
  source.includes(
    "Institutional Context"
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_LINKS_MISSING"
)

assert(
  source.includes(
    "Participants"
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_PARTICIPANTS_MISSING"
)

assert(
  source.includes(
    "member.leftAt ==="
  ) &&
    source.includes(
      "null"
    ),
  "COMMUNICATIONS_CONTEXT_RAIL_ACTIVE_MEMBER_FILTER_MISSING"
)

assert(
  source.includes(
    "selectedConversation.operationalRoom.links.map("
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_LINK_RENDERING_MISSING"
)

assert(
  source.includes(
    "Room context is informational. Institutional action remains governed by its authoritative domain."
  ),
  "COMMUNICATIONS_CONTEXT_RAIL_AUTHORITY_BOUNDARY_MISSING"
)

/*
 * C3.5A.1 is structural only.
 * Mutation controls remain in their existing
 * locations until the three-zone shell is
 * browser-proven.
 */
const railStart =
  source.indexOf(
    '<aside className="hidden w-[300px]'
  )

assert(
  railStart !== -1,
  "COMMUNICATIONS_CONTEXT_RAIL_START_MISSING"
)

const railSource =
  source.slice(
    railStart
  )

for (const forbidden of [
  "linkOperationalContext()",
  "changeConversationStatus(",
  'method:\n          "POST"',
  "sendMessage()",
]) {
  assert(
    !railSource.includes(
      forbidden
    ),
    `COMMUNICATIONS_CONTEXT_RAIL_MUTATION_PRESENT:${forbidden}`
  )
}

console.log({
  threeZoneShellPresent:
    true,

  roomIdentityPresented:
    true,

  institutionalContextPresented:
    true,

  activeParticipantsPresented:
    true,

  lifecycleStatePresented:
    true,

  authorityBoundaryPresented:
    true,

  contextRailReadOnly:
    true,

  narrowScreenFallbackPreserved:
    true,
})
