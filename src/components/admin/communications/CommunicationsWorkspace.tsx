"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { useCommunicationsRealtime } from "@/lib/realtime/communications/CommunicationsProvider"
import { isCurrentConversationLoad } from "@/domains/communications/client/isCurrentConversationLoad"
import {
  COMMUNICATION_OPERATIONAL_ROOM_CLASSES,
  COMMUNICATION_OPERATIONAL_TARGET_TYPES,
  COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES,
} from "@/domains/communications/operational/operationalVocabulary"
import {
  COMMUNICATION_SENDABLE_MESSAGE_KINDS,
  type CommunicationMessageKind,
  type CommunicationSendableMessageKind,
} from "@/domains/communications/messages/messageVocabulary"

type CommunicationUser = {
  id: string
  email: string
  displayName: string | null
  name: string | null
}

type CommunicationMember = {
  id: string
  conversationId: string
  userId: string
  role: string
  joinedAt: string
  leftAt: string | null
  lastReadMessageId: string | null
  lastReadAt: string | null
  user: CommunicationUser
}

type CommunicationMessage = {
  id: string
  conversationId: string
  senderUserId: string
  kind: CommunicationMessageKind
  body: string
  createdAt: string

  workflowTargetType: string | null
  workflowTargetSubtype: string | null
  workflowTargetId: string | null
}

type CommunicationOperationalLink = {
  id: string
  targetType: string
  targetSubtype: string
  targetId: string
  linkedByUserId: string
  linkedAt: string
}

type CommunicationOperationalRoom = {
  id: string
  roomClass: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  links: CommunicationOperationalLink[]
}

type CommunicationConversation = {
  id: string
  kind: string
  status: "ACTIVE" | "ARCHIVED"
  title: string | null
  directKey: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  members: CommunicationMember[]
  messages: CommunicationMessage[]
  unreadCount: number
  operationalRoom: CommunicationOperationalRoom | null
}

type ConversationsResponse = {
  ok: boolean
  conversations?: CommunicationConversation[]
  error?: string
}

type CommunicationInstitutionalReflection = {
  id: string
  operationalRoomId: string

  sourceSystem: string
  sourceEventId: string

  sourceAggregateType: string
  sourceAggregateId: string
  sourceEventType: string
  sourceOccurredAt: string

  targetType: string
  targetSubtype: string
  targetId: string

  reflectionType: string
  reflectionCode: string

  createdAt: string
}

type CommunicationTimelineMessageItem = {
  itemType: "MESSAGE"
  id: string
  occurredAt: string
  message: CommunicationMessage
}

type CommunicationTimelineReflectionItem = {
  itemType: "INSTITUTIONAL_REFLECTION"
  id: string
  occurredAt: string
  reflection: CommunicationInstitutionalReflection
}

type CommunicationTimelineItem =
  | CommunicationTimelineMessageItem
  | CommunicationTimelineReflectionItem

type CommunicationTimeline = {
  conversationId: string
  items: CommunicationTimelineItem[]
  messageCount: number
  reflectionCount: number
}

type TimelineResponse = {
  ok: boolean
  timeline?: CommunicationTimeline
  error?: string
}

type MessageResponse = {
  ok: boolean
  message?: CommunicationMessage
  error?: string
}

type CommunicationDirectoryEntry = {
  id: string
  displayName: string | null
  name: string | null
  email: string
}

type DirectoryResponse = {
  ok: boolean
  users?: CommunicationDirectoryEntry[]
  error?: string
}

type DirectConversationResponse = {
  ok: boolean
  conversation?: CommunicationConversation
  error?: string
}

type OperationalRoomCreationResponse = {
  ok: boolean
  conversation?: CommunicationConversation
  error?: string
}

type OperationalTargetLinkResponse = {
  ok: boolean
  link?: CommunicationOperationalLink
  error?: string
}

function userLabel(
  user: CommunicationUser
) {
  return (
    user.displayName ||
    user.name ||
    user.email
  )
}

function operationalRoomClassLabel(
  roomClass: string
) {
  return roomClass
    .replaceAll(
      "_",
      " "
    )
}

function operationalTargetTypeLabel(
  targetType: string
) {
  if (
    targetType ===
    "TREASURY_GATEWAY_AGGREGATE"
  ) {
    return "TREASURY"
  }

  if (
    targetType ===
    "TRANSACTION_DOSSIER"
  ) {
    return "DOSSIER"
  }

  return targetType.replaceAll(
    "_",
    " "
  )
}

function operationalTreasurySubtypeLabel(
  targetSubtype: string
) {
  return targetSubtype.replaceAll(
    "_",
    " "
  )
}

function operationalTargetLabel(
  link: CommunicationOperationalLink
) {
  if (
    link.targetType ===
    "TREASURY_GATEWAY_AGGREGATE"
  ) {
    return `TREASURY · ${link.targetSubtype.replaceAll(
      "_",
      " "
    )}`
  }

  if (
    link.targetType ===
    "TRANSACTION_DOSSIER"
  ) {
    return "DOSSIER"
  }

  return link.targetType.replaceAll(
    "_",
    " "
  )
}

function compactOperationalTargetId(
  targetId: string
) {
  if (
    targetId.length <=
    18
  ) {
    return targetId
  }

  return `${targetId.slice(
    0,
    10
  )}…${targetId.slice(-6)}`
}

function conversationLabel(
  conversation: CommunicationConversation,
  currentUserId: string
) {
  if (
    conversation.title &&
    conversation.title.trim()
  ) {
    return conversation.title
  }

  const others =
    conversation.members.filter(
      (member) =>
        member.userId !==
        currentUserId
    )

  if (others.length === 0) {
    return "Conversation"
  }

  return others
    .map(
      (member) =>
        userLabel(
          member.user
        )
    )
    .join(", ")
}

function communicationMessageKindLabel(
  kind: CommunicationMessageKind
) {
  if (
    kind ===
    "TEXT"
  ) {
    return "Message"
  }

  return kind.replaceAll(
    "_",
    " "
  )
}

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  )
}

function formatConversationTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  )
}

export default function CommunicationsWorkspace({
  currentUserId,
  canManageConversations,
  canCreateOperationalRooms,
}: {
  currentUserId: string
  canManageConversations: boolean
  canCreateOperationalRooms: boolean
}) {
  const realtime =
    useCommunicationsRealtime()

  const [
    conversations,
    setConversations,
  ] =
    useState<
      CommunicationConversation[]
    >([])

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] =
    useState<string | null>(
      null
    )

  const [
    timelineItems,
    setTimelineItems,
  ] =
    useState<
      CommunicationTimelineItem[]
    >([])

  /*
   * Async lifecycle work must not depend on
   * render-time selection closures.
   */
  const selectedConversationIdRef =
    useRef<string | null>(
      null
    )

  /*
   * Each selection change or timeline retrieval
   * invalidates older timeline-load generations.
   */
  const timelineLoadGenerationRef =
    useRef(0)

  const selectConversation =
    useCallback(
      (
        conversationId: string | null
      ) => {
        selectedConversationIdRef.current =
          conversationId

        timelineLoadGenerationRef.current +=
          1

        setSelectedConversationId(
          conversationId
        )

        if (!conversationId) {
          setTimelineItems([])
        }
      },
      []
    )

  const [
    composerBody,
    setComposerBody,
  ] =
    useState("")

  const [
    composerClientMessageId,
    setComposerClientMessageId,
  ] =
    useState(() =>
      crypto.randomUUID()
    )

  const [
    composerKind,
    setComposerKind,
  ] =
    useState<
      CommunicationSendableMessageKind
    >("TEXT")

  const [
    composerWorkflowLinkId,
    setComposerWorkflowLinkId,
  ] =
    useState("")

  const [
    loadingConversations,
    setLoadingConversations,
  ] =
    useState(true)

  const [
    loadingMessages,
    setLoadingMessages,
  ] =
    useState(false)

  const [
    sending,
    setSending,
  ] =
    useState(false)

  /*
   * Presentation state is asynchronous.
   * This ref is the synchronous send lock.
   */
  const sendingRef =
    useRef(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    )

  const [
    creatingConversation,
    setCreatingConversation,
  ] =
    useState(false)

  const [
    directoryOpen,
    setDirectoryOpen,
  ] =
    useState(false)

  const [
    directoryUsers,
    setDirectoryUsers,
  ] =
    useState<
      CommunicationDirectoryEntry[]
    >([])

  const [
    loadingDirectory,
    setLoadingDirectory,
  ] =
    useState(false)

  const [
    operationalRoomOpen,
    setOperationalRoomOpen,
  ] =
    useState(false)

  const [
    operationalRoomTitle,
    setOperationalRoomTitle,
  ] =
    useState("")

  const [
    operationalRoomClass,
    setOperationalRoomClass,
  ] =
    useState("GENERAL_OPERATIONS")

  const [
    operationalRoomMemberUserIds,
    setOperationalRoomMemberUserIds,
  ] =
    useState<string[]>([])

  const [
    operationalRoomClientRoomId,
    setOperationalRoomClientRoomId,
  ] =
    useState(() =>
      crypto.randomUUID()
    )

  const [
    creatingOperationalRoom,
    setCreatingOperationalRoom,
  ] =
    useState(false)

  const [
    linkContextOpen,
    setLinkContextOpen,
  ] =
    useState(false)

  const [
    operationalTargetType,
    setOperationalTargetType,
  ] =
    useState<string>(
      COMMUNICATION_OPERATIONAL_TARGET_TYPES[0]
    )

  const [
    operationalTreasurySubtype,
    setOperationalTreasurySubtype,
  ] =
    useState<string>(
      COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES[0]
    )

  const [
    operationalTargetId,
    setOperationalTargetId,
  ] =
    useState("")

  const [
    linkingOperationalTarget,
    setLinkingOperationalTarget,
  ] =
    useState(false)

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        selectedConversationId
    ) ?? null

  const [
    changingConversationStatus,
    setChangingConversationStatus,
  ] =
    useState(false)

  const conversationArchived =
    selectedConversation?.status ===
    "ARCHIVED"

  useEffect(
    () => {
      setLinkContextOpen(
        false
      )

      setOperationalTargetId(
        ""
      )

      setComposerWorkflowLinkId(
        ""
      )
    },
    [
      selectedConversationId,
    ]
  )

  const loadConversations =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/communications/conversations",
              {
                cache:
                  "no-store",
              }
            )

          const payload =
            await response.json() as ConversationsResponse

          if (
            !response.ok ||
            !payload.ok ||
            !payload.conversations
          ) {
            throw new Error(
              payload.error ??
                "COMMUNICATIONS_LIST_FAILED"
            )
          }

          setConversations(
            payload.conversations
          )

          const current =
            selectedConversationIdRef.current

          if (
            current &&
            !payload.conversations.some(
              (conversation) =>
                conversation.id === current
            )
          ) {
            /*
             * Authoritative inbox no longer contains
             * the selected conversation.
             *
             * Never retain stale local authority and
             * never auto-select another thread.
             */
            selectConversation(
              null
            )
          }

          setError(null)
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "COMMUNICATIONS_LIST_FAILED"
          )
        } finally {
          setLoadingConversations(
            false
          )
        }
      },
      []
    )

  const markRead =
    useCallback(
      async (
        conversationId: string,
        throughMessageId: string
      ) => {
        try {
          const response =
            await fetch(
              `/api/communications/conversations/${encodeURIComponent(
                conversationId
              )}/read`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    throughMessageId,
                  }),
              }
            )

          return response.ok
        } catch {
          /*
           * Read acknowledgement is secondary
           * to durable message retrieval.
           */
          return false
        }
      },
      []
    )

  const loadTimeline =
    useCallback(
      async (
        conversationId: string
      ) => {
        /*
         * A newer load or selection change
         * invalidates this generation.
         */
        const generation =
          ++timelineLoadGenerationRef.current

        setLoadingMessages(
          true
        )

        try {
          const response =
            await fetch(
              `/api/communications/conversations/${encodeURIComponent(
                conversationId
              )}/timeline?messageLimit=100&reflectionLimit=100`,
              {
                cache:
                  "no-store",
              }
            )

          const payload =
            await response.json() as TimelineResponse

          if (
            !response.ok ||
            !payload.ok ||
            !payload.timeline
          ) {
            throw new Error(
              payload.error ??
                "COMMUNICATION_TIMELINE_FAILED"
            )
          }

          if (
            !isCurrentConversationLoad({
              requestedConversationId:
                conversationId,
              selectedConversationId:
                selectedConversationIdRef.current,
              generation,
              currentGeneration:
                timelineLoadGenerationRef.current,
            })
          ) {
            return
          }

          setTimelineItems(
            payload.timeline.items
          )

          /*
           * Read acknowledgement remains message-only.
           *
           * The timeline is chronological ascending,
           * so the newest MESSAGE is found from the end.
           * A reflection never advances lastReadMessageId.
           */
          const newestMessage =
            [...payload.timeline.items]
              .reverse()
              .find(
                (
                  item
                ): item is CommunicationTimelineMessageItem =>
                  item.itemType ===
                  "MESSAGE"
              )

          if (newestMessage) {
            await markRead(
              conversationId,
              newestMessage.message.id
            )
          }

          /*
           * Selection may have changed while the
           * message read acknowledgement was in flight.
           */
          if (
            !isCurrentConversationLoad({
              requestedConversationId:
                conversationId,
              selectedConversationId:
                selectedConversationIdRef.current,
              generation,
              currentGeneration:
                timelineLoadGenerationRef.current,
            })
          ) {
            return
          }

          /*
           * Conversation-list unread state remains
           * authoritative on the server.
           */
          await loadConversations()

          setError(null)
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "COMMUNICATION_TIMELINE_FAILED"

          if (
            message ===
              "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
          ) {
            if (
              selectedConversationIdRef.current ===
              conversationId
            ) {
              selectConversation(
                null
              )
            }

            await loadConversations()
          }

          setError(
            message
          )
        } finally {
          if (
            generation ===
            timelineLoadGenerationRef.current
          ) {
            setLoadingMessages(
              false
            )
          }
        }
      },
      [
        markRead,
        loadConversations,
        selectConversation,
      ]
    )

  useEffect(
    () => {
      void loadConversations()
    },
    [
      loadConversations,
    ]
  )

  useEffect(
    () => {
      if (
        !selectedConversationId
      ) {
        setTimelineItems([])
        return
      }

      void loadTimeline(
        selectedConversationId
      )
    },
    [
      loadTimeline,
      selectedConversationId,
    ]
  )

  /*
   * Realtime is advisory.
   *
   * A signal triggers authoritative
   * HTTP retrieval rather than mutating
   * message state directly.
   */
  useEffect(
    () => {
      const signal =
        realtime.lastSignal

      if (!signal) {
        return
      }

      if (
        signal.conversationId ===
        selectedConversationId
      ) {
        /*
         * Active conversation:
         * retrieve → mark read → refresh list.
         *
         * loadTimeline owns this sequence so
         * unread state cannot race the message read marker.
         */
        void loadTimeline(
          signal.conversationId
        )

        return
      }

      /*
       * Background conversation:
       * refresh the authoritative unread count
       * without marking anything read.
       */
      void loadConversations()
    },
    [
      realtime.revision,
      realtime.lastSignal,
      selectedConversationId,
      loadConversations,
      loadTimeline,
    ]
  )

  async function openDirectory() {
    if (directoryOpen) {
      setDirectoryOpen(false)
      return
    }

    setDirectoryOpen(true)

    if (directoryUsers.length > 0) {
      return
    }

    setLoadingDirectory(true)

    try {
      const response =
        await fetch(
          "/api/communications/directory?purpose=DIRECT",
          {
            cache:
              "no-store",
          }
        )

      const payload =
        await response.json() as DirectoryResponse

      if (
        !response.ok ||
        !payload.ok ||
        !payload.users
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_DIRECTORY_FAILED"
        )
      }

      setDirectoryUsers(
        payload.users
      )

      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_DIRECTORY_FAILED"
      )
    } finally {
      setLoadingDirectory(false)
    }
  }

  async function openOperationalRoom() {
    if (
      !canCreateOperationalRooms
    ) {
      return
    }

    if (operationalRoomOpen) {
      setOperationalRoomOpen(false)
      return
    }

    setDirectoryOpen(false)
    setOperationalRoomOpen(true)
    setLoadingDirectory(true)

    try {
      const response =
        await fetch(
          "/api/communications/directory?purpose=GROUP",
          {
            cache:
              "no-store",
          }
        )

      const payload =
        await response.json() as DirectoryResponse

      if (
        !response.ok ||
        !payload.ok ||
        !payload.users
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_GROUP_DIRECTORY_FAILED"
        )
      }

      setDirectoryUsers(
        payload.users
      )

      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_GROUP_DIRECTORY_FAILED"
      )
    } finally {
      setLoadingDirectory(false)
    }
  }

  function toggleOperationalRoomMember(
    userId: string
  ) {
    setOperationalRoomMemberUserIds(
      current =>
        current.includes(
          userId
        )
          ? current.filter(
              id =>
                id !==
                userId
            )
          : [
              ...current,
              userId,
            ]
    )
  }

  async function createOperationalRoom() {
    if (
      !canCreateOperationalRooms ||
      creatingOperationalRoom ||
      !operationalRoomTitle.trim()
    ) {
      return
    }

    setCreatingOperationalRoom(
      true
    )

    try {
      const response =
        await fetch(
          "/api/communications/operational-rooms",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                clientRoomId:
                  operationalRoomClientRoomId,

                title:
                  operationalRoomTitle,

                roomClass:
                  operationalRoomClass,

                memberUserIds:
                  operationalRoomMemberUserIds,
              }),
          }
        )

      const payload =
        await response.json() as OperationalRoomCreationResponse

      if (
        !response.ok ||
        !payload.ok ||
        !payload.conversation
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_OPERATIONAL_ROOM_CREATE_FAILED"
        )
      }

      const conversationId =
        payload.conversation.id

      /*
       * Rotate clientRoomId only after durable
       * success. Ambiguous/failed retries retain
       * the same submission identity.
       */
      setOperationalRoomClientRoomId(
        crypto.randomUUID()
      )

      setOperationalRoomTitle("")
      setOperationalRoomClass(
        "GENERAL_OPERATIONS"
      )
      setOperationalRoomMemberUserIds(
        []
      )
      setOperationalRoomOpen(
        false
      )

      await loadConversations()

      selectConversation(
        conversationId
      )

      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_OPERATIONAL_ROOM_CREATE_FAILED"
      )
    } finally {
      setCreatingOperationalRoom(
        false
      )
    }
  }

  async function createDirectConversation(
    otherUserId: string
  ) {
    if (creatingConversation) {
      return
    }

    setCreatingConversation(true)

    try {
      const response =
        await fetch(
          "/api/communications/conversations/direct",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                otherUserId,
              }),
          }
        )

      const payload =
        await response.json() as DirectConversationResponse

      if (
        !response.ok ||
        !payload.ok ||
        !payload.conversation
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_DIRECT_CREATE_FAILED"
        )
      }

      const conversationId =
        payload.conversation.id

      /*
       * Reload authoritative list first so the
       * selected conversation exists in local state.
       */
      await loadConversations()

      selectConversation(
        conversationId
      )

      setDirectoryOpen(false)

      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_DIRECT_CREATE_FAILED"
      )
    } finally {
      setCreatingConversation(false)
    }
  }

  async function linkOperationalContext() {
    const conversation =
      selectedConversation

    const room =
      conversation?.operationalRoom

    if (
      !conversation ||
      !room ||
      conversation.status !==
        "ACTIVE" ||
      !canManageConversations ||
      linkingOperationalTarget ||
      !operationalTargetId.trim()
    ) {
      return
    }

    setLinkingOperationalTarget(
      true
    )

    try {
      const targetSubtype =
        operationalTargetType ===
        "TREASURY_GATEWAY_AGGREGATE"
          ? operationalTreasurySubtype
          : operationalTargetType

      const response =
        await fetch(
          `/api/communications/operational-rooms/${room.id}/links`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                targetType:
                  operationalTargetType,

                targetSubtype,

                targetId:
                  operationalTargetId,
              }),
          }
        )

      const payload =
        await response.json() as OperationalTargetLinkResponse

      if (
        !response.ok ||
        !payload.ok ||
        !payload.link
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_OPERATIONAL_TARGET_LINK_FAILED"
        )
      }

      setOperationalTargetId(
        ""
      )

      setLinkContextOpen(
        false
      )

      /*
       * Conversation retrieval is authoritative
       * for room context. The link response itself
       * is only the command acknowledgement.
       */
      await loadConversations()

      setError(null)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_OPERATIONAL_TARGET_LINK_FAILED"
      )
    } finally {
      setLinkingOperationalTarget(
        false
      )
    }
  }

  async function changeConversationStatus(
    action:
      | "archive"
      | "reactivate"
  ) {
    if (
      !selectedConversationId ||
      !canManageConversations ||
      changingConversationStatus
    ) {
      return
    }

    const conversationId =
      selectedConversationId

    setChangingConversationStatus(
      true
    )

    try {
      const response =
        await fetch(
          `/api/communications/conversations/${encodeURIComponent(
            conversationId
          )}/${action}`,
          {
            method:
              "POST",
          }
        )

      const payload =
        await response.json() as {
          ok: boolean
          conversation?: CommunicationConversation
          error?: string
        }

      if (
        !response.ok ||
        !payload.ok ||
        !payload.conversation
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_CONVERSATION_STATUS_CHANGE_FAILED"
        )
      }

      /*
       * Re-load authoritative server state rather
       * than mutating the conversation locally.
       */
      await loadConversations()

      setError(null)
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_CONVERSATION_STATUS_CHANGE_FAILED"

      if (
        message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
      ) {
        if (
          selectedConversationIdRef.current ===
          conversationId
        ) {
          selectConversation(
            null
          )
        }

        await loadConversations()
      }

      setError(
        message
      )
    } finally {
      setChangingConversationStatus(
        false
      )
    }
  }

  async function sendMessage() {
    if (
      !selectedConversationId ||
      conversationArchived ||
      !composerBody.trim() ||
      sendingRef.current
    ) {
      return
    }

    /*
     * Acquire before the first await so rapid
     * repeated input cannot start a second POST.
     */
    sendingRef.current = true

    const body =
      composerBody.trim()

    const kind =
      composerKind

    const conversationId =
      selectedConversationId

    const workflowLink =
      composerWorkflowLinkId
        ? selectedConversation?.operationalRoom?.links.find(
            (link) =>
              link.id ===
              composerWorkflowLinkId
          ) ?? null
        : null

    /*
     * Composer context may only narrow scope
     * already established by an Operational Room
     * link. It cannot synthesize a target.
     */
    if (
      composerWorkflowLinkId &&
      !workflowLink
    ) {
      setError(
        "COMMUNICATION_MESSAGE_WORKFLOW_TARGET_NOT_LINKED"
      )

      sendingRef.current =
        false

      return
    }

    const workflowReference =
      workflowLink
        ? {
            targetType:
              workflowLink.targetType,

            targetSubtype:
              workflowLink.targetSubtype,

            targetId:
              workflowLink.targetId,
          }
        : null

    setSending(true)

    try {
      const response =
        await fetch(
          `/api/communications/conversations/${encodeURIComponent(
            conversationId
          )}/messages`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                body,
                kind,
                clientMessageId:
                  composerClientMessageId,
                workflowReference,
              }),
          }
        )

      const payload =
        await response.json() as MessageResponse

      if (
        !response.ok ||
        !payload.ok
      ) {
        throw new Error(
          payload.error ??
            "COMMUNICATION_MESSAGE_SEND_FAILED"
        )
      }

      /*
       * Only rotate submission identity after
       * durable success is confirmed.
       *
       * A failed/ambiguous retry therefore uses
       * the same clientMessageId.
       */
      setComposerBody("")
      setComposerKind(
        "TEXT"
      )
      setComposerWorkflowLinkId(
        ""
      )
      setComposerClientMessageId(
        crypto.randomUUID()
      )

      await loadTimeline(
        conversationId
      )

      setError(null)
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "COMMUNICATION_MESSAGE_SEND_FAILED"

      if (
        message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
      ) {
        /*
         * Preserve the unsent draft and its
         * clientMessageId, but remove stale thread
         * authority from the workspace.
         */
        if (
          selectedConversationIdRef.current ===
          conversationId
        ) {
          selectConversation(
            null
          )
        }

        await loadConversations()
      }

      setError(
        message
      )
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const activeConversations =
    conversations.filter(
      conversation =>
        conversation.status ===
        "ACTIVE"
    )

  const archivedConversations =
    conversations.filter(
      conversation =>
        conversation.status ===
        "ARCHIVED"
    )

  function renderConversationRow(
    conversation: CommunicationConversation,
    archived = false
  ) {
    const latest =
      conversation.messages[0]

    const unread =
      !archived &&
      conversation.unreadCount > 0

    const selected =
      conversation.id ===
      selectedConversationId

    return (
      <button
        key={
          conversation.id
        }
        type="button"
        onClick={() => {
          selectConversation(
            conversation.id
          )
        }}
        className={`w-full border-b border-neutral-900 px-4 py-4 text-left transition ${
          selected
            ? "bg-neutral-900"
            : archived
              ? "bg-neutral-950/40 hover:bg-neutral-950"
              : "bg-transparent hover:bg-neutral-950"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {unread ? (
                <span
                  aria-label={`${conversation.unreadCount} unread`}
                  className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/50 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300"
                >
                  {conversation.unreadCount}
                </span>
              ) : null}

              <div
                className={`truncate text-sm font-medium ${
                  archived
                    ? "text-neutral-400"
                    : "text-white"
                }`}
              >
                {conversationLabel(
                  conversation,
                  currentUserId
                )}
              </div>

              {conversation.operationalRoom ? (
                <span className="shrink-0 rounded-full border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-neutral-500">
                  {operationalRoomClassLabel(
                    conversation.operationalRoom.roomClass
                  )}
                </span>
              ) : null}

              {archived ? (
                <span className="shrink-0 rounded-full border border-neutral-800 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-neutral-600">
                  Archived
                </span>
              ) : null}
            </div>

            <div className="mt-1 truncate text-xs text-neutral-500">
              {latest
                ? latest.body
                : "No messages yet"}
            </div>
          </div>

          <div className="shrink-0 text-[10px] text-neutral-600">
            {formatConversationTime(
              conversation.updatedAt
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-[560px] overflow-hidden rounded-xl border border-neutral-800 bg-black/40">
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-neutral-800">
        <div className="border-b border-neutral-800 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Conversations
              </div>
              <div className="mt-1 text-sm text-neutral-300">
                Institutional direct messaging
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOperationalRoomOpen(
                    false
                  )

                  void openDirectory()
                }}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-neutral-300 transition hover:border-neutral-500 hover:text-white"
              >
                New
              </button>

              {canCreateOperationalRooms ? (
                <button
                  type="button"
                  onClick={() => {
                    void openOperationalRoom()
                  }}
                  className="rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                >
                  Room
                </button>
              ) : null}

              <div
                className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${
                  realtime.connected
                    ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
                    : "border-neutral-700 bg-neutral-950 text-neutral-500"
                }`}
              >
                {realtime.connected
                  ? "Live"
                  : "Offline"}
              </div>
            </div>
          </div>
        </div>

        {operationalRoomOpen ? (
          <div className="border-b border-neutral-800 bg-neutral-950/80">
            <div className="space-y-3 px-4 py-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  New Operational Room
                </div>

                <div className="mt-1 text-xs leading-5 text-neutral-600">
                  Governed coordination space. Creating a room does not execute institutional action.
                </div>
              </div>

              <input
                value={
                  operationalRoomTitle
                }
                onChange={event => {
                  setOperationalRoomTitle(
                    event.target.value
                  )
                }}
                maxLength={200}
                placeholder="Room title"
                className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-700 focus:border-neutral-600"
              />

              <select
                value={
                  operationalRoomClass
                }
                onChange={event => {
                  setOperationalRoomClass(
                    event.target.value
                  )
                }}
                className="w-full rounded-md border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-300 outline-none focus:border-neutral-600"
              >
                {COMMUNICATION_OPERATIONAL_ROOM_CLASSES.map(
                  roomClass => (
                    <option
                      key={
                        roomClass
                      }
                      value={
                        roomClass
                      }
                    >
                      {operationalRoomClassLabel(
                        roomClass
                      )}
                    </option>
                  )
                )}
              </select>

              <div>
                <div className="mb-2 text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                  Members
                </div>

                <div className="max-h-[150px] overflow-y-auto rounded-md border border-neutral-900">
                  {loadingDirectory ? (
                    <div className="px-3 py-3 text-xs text-neutral-600">
                      Loading people…
                    </div>
                  ) : directoryUsers.length ===
                    0 ? (
                    <div className="px-3 py-3 text-xs text-neutral-600">
                      No eligible participants.
                    </div>
                  ) : (
                    directoryUsers.map(
                      user => {
                        const selected =
                          operationalRoomMemberUserIds.includes(
                            user.id
                          )

                        return (
                          <button
                            key={
                              user.id
                            }
                            type="button"
                            onClick={() => {
                              toggleOperationalRoomMember(
                                user.id
                              )
                            }}
                            className={`block w-full border-t border-neutral-900 px-3 py-2.5 text-left first:border-t-0 ${
                              selected
                                ? "bg-neutral-900"
                                : "hover:bg-neutral-950"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-xs text-neutral-300">
                                  {userLabel(
                                    user
                                  )}
                                </div>

                                <div className="mt-0.5 truncate text-[10px] text-neutral-700">
                                  {user.email}
                                </div>
                              </div>

                              <span className="shrink-0 text-[9px] uppercase tracking-[0.12em] text-neutral-600">
                                {selected
                                  ? "Included"
                                  : "Add"}
                              </span>
                            </div>
                          </button>
                        )
                      }
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-700">
                  {operationalRoomMemberUserIds.length} additional members
                </div>

                <button
                  type="button"
                  disabled={
                    creatingOperationalRoom ||
                    !operationalRoomTitle.trim()
                  }
                  onClick={() => {
                    void createOperationalRoom()
                  }}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-200 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creatingOperationalRoom
                    ? "Creating"
                    : "Create Room"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {directoryOpen ? (
          <div className="border-b border-neutral-800 bg-neutral-950/80">
            <div className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                New conversation
              </div>
            </div>

            <div className="max-h-[260px] overflow-y-auto border-t border-neutral-900">
              {loadingDirectory ? (
                <div className="px-4 py-4 text-sm text-neutral-500">
                  Loading people…
                </div>
              ) : directoryUsers.length === 0 ? (
                <div className="px-4 py-4 text-sm text-neutral-500">
                  No eligible recipients.
                </div>
              ) : (
                directoryUsers.map(
                  (user) => (
                    <button
                      key={user.id}
                      type="button"
                      disabled={creatingConversation}
                      onClick={() => {
                        void createDirectConversation(
                          user.id
                        )
                      }}
                      className="block w-full border-t border-neutral-900 px-4 py-3 text-left transition first:border-t-0 hover:bg-neutral-900 disabled:cursor-wait disabled:opacity-50"
                    >
                      <div className="truncate text-sm text-neutral-200">
                        {userLabel(
                          user
                        )}
                      </div>

                      <div className="mt-1 truncate text-xs text-neutral-600">
                        {user.email}
                      </div>
                    </button>
                  )
                )
              )}
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-sm text-neutral-500">
              Loading conversations…
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-5">
              <div className="text-sm text-neutral-300">
                No conversations yet.
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Start a new conversation with an authorized AXPT communications participant.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-neutral-900 bg-neutral-950/60 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                    Active
                  </span>

                  <span className="text-[9px] tabular-nums text-neutral-600">
                    {activeConversations.length}
                  </span>
                </div>
              </div>

              {activeConversations.length >
              0 ? (
                activeConversations.map(
                  conversation =>
                    renderConversationRow(
                      conversation
                    )
                )
              ) : (
                <div className="border-b border-neutral-900 px-4 py-4 text-xs text-neutral-600">
                  No active conversations.
                </div>
              )}

              {archivedConversations.length >
              0 ? (
                <>
                  <div className="border-b border-neutral-900 border-t border-t-neutral-800 bg-neutral-950/80 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                        Archive
                      </span>

                      <span className="text-[9px] tabular-nums text-neutral-700">
                        {archivedConversations.length}
                      </span>
                    </div>
                  </div>

                  {archivedConversations.map(
                    conversation =>
                      renderConversationRow(
                        conversation,
                        true
                      )
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
            <div className="border-b border-neutral-800 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                      {selectedConversation.operationalRoom
                        ? "Operational Room"
                        : "Direct Conversation"}
                    </div>

                    {selectedConversation.operationalRoom ? (
                      <div className="rounded-full border border-neutral-700 bg-neutral-950 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-neutral-400">
                        {operationalRoomClassLabel(
                          selectedConversation.operationalRoom.roomClass
                        )}
                      </div>
                    ) : null}

                    {conversationArchived ? (
                      <div className="rounded-full border border-neutral-700 bg-neutral-950 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                        Archived
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-1 truncate text-base font-medium text-white">
                    {conversationLabel(
                      selectedConversation,
                      currentUserId
                    )}
                  </div>

                  {selectedConversation.operationalRoom ? (
                    <div className="mt-3">
                      <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                        {selectedConversation.operationalRoom.links.length ===
                        1
                          ? "1 linked institutional object"
                          : `${selectedConversation.operationalRoom.links.length} linked institutional objects`}
                      </div>

                      {selectedConversation.operationalRoom.links.length >
                      0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedConversation.operationalRoom.links.map(
                            link => (
                              <div
                                key={
                                  link.id
                                }
                                title={
                                  link.targetId
                                }
                                className="rounded-md border border-neutral-800 bg-neutral-950/80 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-neutral-500"
                              >
                                <span className="text-neutral-400">
                                  {operationalTargetLabel(
                                    link
                                  )}
                                </span>

                                <span className="mx-1.5 text-neutral-700">
                                  ·
                                </span>

                                <span className="font-mono normal-case tracking-normal text-neutral-600">
                                  {compactOperationalTargetId(
                                    link.targetId
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : null}

                      {canManageConversations &&
                      !conversationArchived ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setLinkContextOpen(
                                current =>
                                  !current
                              )
                            }}
                            className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-300"
                          >
                            {linkContextOpen
                              ? "Close Context"
                              : "Link Context"}
                          </button>

                          {linkContextOpen ? (
                            <div className="mt-3 grid max-w-xl grid-cols-1 gap-2 rounded-lg border border-neutral-800 bg-black/60 p-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="mb-1 block text-[8px] uppercase tracking-[0.14em] text-neutral-600">
                                  Target
                                </span>

                                <select
                                  value={
                                    operationalTargetType
                                  }
                                  onChange={event => {
                                    setOperationalTargetType(
                                      event.target.value
                                    )
                                  }}
                                  className="w-full rounded-md border border-neutral-800 bg-black px-2.5 py-2 text-[10px] text-neutral-300 outline-none focus:border-neutral-600"
                                >
                                  {COMMUNICATION_OPERATIONAL_TARGET_TYPES.map(
                                    targetType => (
                                      <option
                                        key={
                                          targetType
                                        }
                                        value={
                                          targetType
                                        }
                                      >
                                        {operationalTargetTypeLabel(
                                          targetType
                                        )}
                                      </option>
                                    )
                                  )}
                                </select>
                              </label>

                              {operationalTargetType ===
                              "TREASURY_GATEWAY_AGGREGATE" ? (
                                <label className="block">
                                  <span className="mb-1 block text-[8px] uppercase tracking-[0.14em] text-neutral-600">
                                    Treasury Object
                                  </span>

                                  <select
                                    value={
                                      operationalTreasurySubtype
                                    }
                                    onChange={event => {
                                      setOperationalTreasurySubtype(
                                        event.target.value
                                      )
                                    }}
                                    className="w-full rounded-md border border-neutral-800 bg-black px-2.5 py-2 text-[10px] text-neutral-300 outline-none focus:border-neutral-600"
                                  >
                                    {COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES.map(
                                      targetSubtype => (
                                        <option
                                          key={
                                            targetSubtype
                                          }
                                          value={
                                            targetSubtype
                                          }
                                        >
                                          {operationalTreasurySubtypeLabel(
                                            targetSubtype
                                          )}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </label>
                              ) : null}

                              <label
                                className={
                                  operationalTargetType ===
                                  "TREASURY_GATEWAY_AGGREGATE"
                                    ? "block sm:col-span-2"
                                    : "block"
                                }
                              >
                                <span className="mb-1 block text-[8px] uppercase tracking-[0.14em] text-neutral-600">
                                  Target ID
                                </span>

                                <input
                                  value={
                                    operationalTargetId
                                  }
                                  onChange={event => {
                                    setOperationalTargetId(
                                      event.target.value
                                    )
                                  }}
                                  placeholder="Institutional object ID"
                                  className="w-full rounded-md border border-neutral-800 bg-black px-2.5 py-2 font-mono text-[10px] text-neutral-300 outline-none placeholder:text-neutral-700 focus:border-neutral-600"
                                />
                              </label>

                              <div className="flex items-end justify-end">
                                <button
                                  type="button"
                                  disabled={
                                    linkingOperationalTarget ||
                                    !operationalTargetId.trim()
                                  }
                                  onClick={() => {
                                    void linkOperationalContext()
                                  }}
                                  className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {linkingOperationalTarget
                                    ? "Attaching"
                                    : "Attach Context"}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {canManageConversations ? (
                  <button
                    type="button"
                    disabled={
                      changingConversationStatus
                    }
                    onClick={() => {
                      void changeConversationStatus(
                        conversationArchived
                          ? "reactivate"
                          : "archive"
                      )
                    }}
                    className="shrink-0 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400 transition hover:border-neutral-500 hover:text-white disabled:cursor-wait disabled:opacity-50"
                  >
                    {changingConversationStatus
                      ? "Updating"
                      : conversationArchived
                        ? "Reactivate"
                        : "Archive"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {loadingMessages ? (
                <div className="text-sm text-neutral-500">
                  Loading history…
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-sm text-center">
                    <div className="text-sm text-neutral-300">
                      No timeline activity yet.
                    </div>
                    <div className="mt-2 text-xs leading-5 text-neutral-600">
                      This conversation is durable, private to its members, and governed by AXPT Communications authority.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineItems.map(
                    (item) => {
                      if (
                        item.itemType ===
                        "INSTITUTIONAL_REFLECTION"
                      ) {
                        const reflection =
                          item.reflection

                        return (
                          <div
                            key={`reflection:${reflection.id}`}
                            className="flex justify-center py-2"
                          >
                            <div className="w-full max-w-[78%] rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                                <span className="rounded border border-neutral-700 px-1.5 py-0.5 text-neutral-400">
                                  Institutional Observation
                                </span>

                                <span>
                                  {reflection.reflectionCode.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>

                                <span>
                                  {formatTime(
                                    reflection.sourceOccurredAt
                                  )}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-neutral-600">
                                <span>
                                  {reflection.sourceSystem.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>

                                <span>
                                  ·
                                </span>

                                <span>
                                  {reflection.sourceAggregateType.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>
                              </div>

                              <div
                                title={`${reflection.targetSubtype} · ${reflection.targetId}`}
                                className="mt-2 truncate font-mono text-[10px] text-neutral-500"
                              >
                                {operationalTargetTypeLabel(
                                  reflection.targetType
                                )}
                                {" · "}
                                {reflection.targetId}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      const message =
                        item.message

                      const own =
                        message.senderUserId ===
                        currentUserId

                      const sender =
                        selectedConversation.members.find(
                          (member) =>
                            member.userId ===
                            message.senderUserId
                        )

                      return (
                        <div
                          key={`message:${message.id}`}
                          className={`flex ${
                            own
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[72%] rounded-xl border px-4 py-3 ${
                              own
                                ? "border-neutral-700 bg-neutral-800"
                                : "border-neutral-800 bg-neutral-950"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                              {message.kind !==
                              "TEXT" ? (
                                <span className="rounded border border-neutral-700 px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-neutral-400">
                                  {communicationMessageKindLabel(
                                    message.kind
                                  )}
                                </span>
                              ) : null}

                              {message.workflowTargetType &&
                              message.workflowTargetSubtype &&
                              message.workflowTargetId ? (
                                <span
                                  title={`${message.workflowTargetSubtype} · ${message.workflowTargetId}`}
                                  className="max-w-[220px] truncate rounded border border-neutral-800 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-neutral-500"
                                >
                                  {operationalTargetTypeLabel(
                                    message.workflowTargetType
                                  )}
                                  {" · "}
                                  {message.workflowTargetId}
                                </span>
                              ) : null}

                              <span>
                                {own
                                  ? "You"
                                  : sender
                                    ? userLabel(
                                        sender.user
                                      )
                                    : "Member"}
                              </span>

                              <span>
                                {formatTime(
                                  message.createdAt
                                )}
                              </span>
                            </div>

                            <div className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-100">
                              {message.body}
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800 bg-black/60 p-4">
              {error ? (
                <div className="mb-3 rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              ) : null}

              {conversationArchived ? (
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Conversation archived
                  </div>

                  <p className="mt-2 text-xs leading-5 text-neutral-600">
                    This history remains available as an institutional record. New messages cannot be added while the conversation is archived.
                  </p>

                  {canManageConversations ? (
                    <button
                      type="button"
                      disabled={
                        changingConversationStatus
                      }
                      onClick={() => {
                        void changeConversationStatus(
                          "reactivate"
                        )
                      }}
                      className="mt-3 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-300 transition hover:bg-neutral-800 hover:text-white disabled:cursor-wait disabled:opacity-50"
                    >
                      {changingConversationStatus
                        ? "Updating"
                        : "Reactivate conversation"}
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
                    <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2">
                      <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                        Classification
                      </span>

                      <label className="min-w-0">
                        <select
                          value={
                            composerKind
                          }
                          onChange={(
                            event
                          ) => {
                            setComposerKind(
                              event.target.value as
                                CommunicationSendableMessageKind
                            )
                          }}
                          disabled={
                            sending
                          }
                          aria-label="Message classification"
                          className="max-w-[260px] cursor-pointer appearance-none border-0 bg-neutral-950 px-2 py-1 text-right text-[9px] uppercase tracking-[0.14em] text-neutral-400 outline-none disabled:cursor-wait disabled:opacity-60"
                        >
                          {COMMUNICATION_SENDABLE_MESSAGE_KINDS.map(
                            (
                              kind
                            ) => (
                              <option
                                key={
                                  kind
                                }
                                value={
                                  kind
                                }
                              >
                                {communicationMessageKindLabel(
                                  kind
                                )}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    </div>

                    {selectedConversation?.operationalRoom &&
                    selectedConversation.operationalRoom.links.length >
                      0 ? (
                      <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2">
                        <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                          Context
                        </span>

                        <label className="min-w-0">
                          <select
                            value={
                              composerWorkflowLinkId
                            }
                            onChange={(
                              event
                            ) => {
                              setComposerWorkflowLinkId(
                                event.target.value
                              )
                            }}
                            disabled={
                              sending
                            }
                            aria-label="Workflow context"
                            className="max-w-[340px] cursor-pointer appearance-none border-0 bg-neutral-950 px-2 py-1 text-right text-[9px] uppercase tracking-[0.12em] text-neutral-400 outline-none disabled:cursor-wait disabled:opacity-60"
                          >
                            <option value="">
                              No linked context
                            </option>

                            {selectedConversation.operationalRoom.links.map(
                              (
                                link
                              ) => (
                                <option
                                  key={
                                    link.id
                                  }
                                  value={
                                    link.id
                                  }
                                >
                                  {operationalTargetTypeLabel(
                                    link.targetType
                                  )}
                                  {" · "}
                                  {link.targetId}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      </div>
                    ) : null}

                    <div className="flex items-end gap-3 p-3">
                      <textarea
                        value={
                          composerBody
                        }
                        onChange={(
                          event
                        ) => {
                          setComposerBody(
                            event.target.value
                          )
                        }}
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing
                          ) {
                            event.preventDefault()
                            void sendMessage()
                          }
                        }}
                        placeholder="Write a message…"
                        rows={2}
                        maxLength={10000}
                        disabled={sending}
                        className="min-h-[52px] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-white outline-none placeholder:text-neutral-600 disabled:cursor-wait disabled:opacity-70"
                      />

                      <button
                        type="button"
                        disabled={
                          sending ||
                          !composerBody.trim()
                        }
                        onClick={() => {
                          void sendMessage()
                        }}
                        className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sending
                          ? "Sending"
                          : "Send"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 px-1 text-[9px] uppercase tracking-[0.14em] text-neutral-700">
                    Enter to send · Shift + Enter for line break
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="text-sm text-neutral-300">
                Select a conversation to open its durable history.
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                Unread communications remain unread until deliberately opened.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
