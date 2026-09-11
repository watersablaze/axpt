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

const hook =
  readFileSync(
    "src/lib/realtime/communications/useCommunicationsStream.ts"
  ).toString(
    "utf8"
  )

const workspace =
  readFileSync(
    "src/components/admin/communications/CommunicationsWorkspace.tsx"
  ).toString(
    "utf8"
  )

assert(
  hook.includes(
    '"COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE"'
  ),
  "REFLECTION_REALTIME_CLIENT_SIGNAL_TYPE_MISSING"
)

assert(
  hook.includes(
    "reflectionId?: string"
  ),
  "REFLECTION_REALTIME_CLIENT_REFLECTION_ID_MISSING"
)

assert(
  hook.includes(
    "operationalRoomId?: string"
  ),
  "REFLECTION_REALTIME_CLIENT_ROOM_ID_MISSING"
)

assert(
  workspace.includes(
    "acknowledgeMessages?: boolean"
  ),
  "REFLECTION_REALTIME_ACK_MODE_MISSING"
)

assert(
  workspace.includes(
    "options?.acknowledgeMessages"
  ),
  "REFLECTION_REALTIME_ACK_DEFAULT_MISSING"
)

assert(
  workspace.includes(
    "acknowledgeMessages &&"
  ) &&
    workspace.includes(
      "await markRead("
    ),
  "REFLECTION_REALTIME_MARK_READ_GUARD_MISSING"
)

assert(
  workspace.includes(
    'signal.type ===\n          "COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE"'
  ),
  "REFLECTION_REALTIME_SIGNAL_BRANCH_MISSING"
)

assert(
  workspace.includes(
    "acknowledgeMessages:\n              !isReflectionSignal"
  ),
  "REFLECTION_REALTIME_SIGNAL_ACK_POLICY_MISSING"
)

/*
 * Realtime remains retrieval-only.
 *
 * The workspace must not synthesize reflection
 * messages or mutate institutional source state.
 */
assert(
  !workspace.includes(
    'kind: "SYSTEM"'
  ),
  "REFLECTION_REALTIME_SYNTHETIC_SYSTEM_MESSAGE_PRESENT"
)

assert(
  !workspace.includes(
    "communicationOperationalReflection.create"
  ),
  "REFLECTION_REALTIME_CLIENT_REFLECTION_MUTATION_PRESENT"
)

assert(
  !workspace.includes(
    "treasuryGatewayEvent"
  ),
  "REFLECTION_REALTIME_CLIENT_TREASURY_EVENT_COUPLING_PRESENT"
)

console.log({
  reflectionSignalRecognized:
    true,

  reflectionIdentityAvailable:
    true,

  timelineRefreshModeExplicit:
    true,

  messageReadGuardPresent:
    true,

  reflectionCannotAcknowledgeMessage:
    true,

  messageSignalMayAcknowledgeMessage:
    true,

  noSyntheticSystemMessage:
    true,

  noReflectionMutation:
    true,

  noTreasuryEventCoupling:
    true,
})
