"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { useSearchParams } from "next/navigation"

import { useCommunicationsRealtime } from "@/lib/realtime/communications/CommunicationsProvider"
import styles from "./CommunicationsWorkspace.module.css"
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


function conversationPrimaryLabel(
  conversation: CommunicationConversation,
  currentUserId: string
) {
  const activeOthers =
    conversation.members.filter(
      member =>
        member.userId !== currentUserId &&
        member.leftAt === null
    )

  if (activeOthers.length === 1) {
    return userLabel(
      activeOthers[0].user
    )
  }

  return conversationLabel(
    conversation,
    currentUserId
  )
}

function conversationSecondaryLabel(
  conversation: CommunicationConversation,
  currentUserId: string
) {
  const primary =
    conversationPrimaryLabel(
      conversation,
      currentUserId
    )

  const canonical =
    conversationLabel(
      conversation,
      currentUserId
    )

  if (
    conversation.title &&
    canonical !== primary
  ) {
    return conversation.title
  }

  if (conversation.operationalRoom) {
    return operationalRoomClassLabel(
      conversation.operationalRoom.roomClass
    )
  }

  return "Direct conversation"
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
  const [linkedConversationError, setLinkedConversationError] =
    useState<string | null>(null)

  const conversationSearchParams = useSearchParams()
  const linkedConversationId =
    conversationSearchParams.get("conversationId")
  const conversationListGenerationRef = useRef(0)
  const pendingLinkedConversationRef =
    useRef<string | null>(null)

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
    newMenuOpen,
    setNewMenuOpen,
  ] =
    useState(false)

  const [
    conversationQuery,
    setConversationQuery,
  ] =
    useState("")

  const [
    recipientQuery,
    setRecipientQuery,
  ] =
    useState("")


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
    responsiveContextOpen,
    setResponsiveContextOpen,
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

  const creationSurfaceOpen =
    newMenuOpen ||
    directoryOpen ||
    operationalRoomOpen


  useEffect(
    () => {
      setLinkContextOpen(
        false
      )

      setResponsiveContextOpen(
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
        const listGeneration = ++conversationListGenerationRef.current
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

          if (listGeneration !== conversationListGenerationRef.current) return

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

          const linkedId =
            pendingLinkedConversationRef.current

          if (linkedId) {
            pendingLinkedConversationRef.current = null

            const permitted =
              linkedId.length <= 191 &&
              payload.conversations.some(
                conversation => conversation.id === linkedId
              )

            if (!permitted) {
              selectConversation(null)
              setLinkedConversationError(
                "The requested conversation is unavailable or you no longer have access."
              )
              return
            }

            selectConversation(linkedId)
          }

          setError(null)
        } catch (cause) {
          if (listGeneration !== conversationListGenerationRef.current) return
          setError(
            cause instanceof Error
              ? cause.message
              : "COMMUNICATIONS_LIST_FAILED"
          )
        } finally {
          if (listGeneration !== conversationListGenerationRef.current) return
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
        conversationId: string,
        options?: {
          acknowledgeMessages?: boolean
        }
      ) => {
        const acknowledgeMessages =
          options?.acknowledgeMessages ??
          true
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

          if (
            acknowledgeMessages &&
            newestMessage
          ) {
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
          if (!isCurrentConversationLoad({
            requestedConversationId: conversationId,
            selectedConversationId: selectedConversationIdRef.current,
            generation,
            currentGeneration: timelineLoadGenerationRef.current,
          })) return

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
      setLinkedConversationError(null)
      pendingLinkedConversationRef.current =
        linkedConversationId
      void loadConversations()
    },
    [
      loadConversations,
      linkedConversationId,
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
         * Realtime remains advisory.
         *
         * A reflection signal may refresh the
         * authoritative timeline, but it has no
         * authority to acknowledge messages.
         */
        const isReflectionSignal =
          signal.type ===
          "COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE"

        void loadTimeline(
          signal.conversationId,
          {
            acknowledgeMessages:
              !isReflectionSignal,
          }
        )

        return
      }

      /*
       * Background signals may refresh the
       * authoritative conversation list.
       *
       * Reflections are not unread messages, so
       * this retrieval cannot create unread state.
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
    setNewMenuOpen(false)

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
    setNewMenuOpen(false)
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

      /*
       * Lifecycle settlement collapses transient
       * governance editing state without disorienting
       * the operator by closing Room Context itself.
       */
      setLinkContextOpen(
        false
      )

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

  const normalizedConversationQuery =
    conversationQuery
      .trim()
      .toLowerCase()

  const conversationMatchesQuery = (
    conversation: CommunicationConversation
  ) => {
    if (!normalizedConversationQuery) {
      return true
    }

    const latest =
      conversation.messages[0]

    const haystack = [
      conversationPrimaryLabel(
        conversation,
        currentUserId
      ),
      conversationSecondaryLabel(
        conversation,
        currentUserId
      ),
      conversation.title ?? "",
      conversation.operationalRoom
        ? operationalRoomClassLabel(
            conversation.operationalRoom.roomClass
          )
        : "",
      latest?.body ?? "",
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(
      normalizedConversationQuery
    )
  }

  const filteredActiveConversations =
    activeConversations.filter(
      conversationMatchesQuery
    )

  const filteredArchivedConversations =
    archivedConversations.filter(
      conversationMatchesQuery
    )

  const normalizedRecipientQuery =
    recipientQuery
      .trim()
      .toLowerCase()

  const filteredDirectoryUsers =
    directoryUsers.filter(
      user => {
        if (!normalizedRecipientQuery) {
          return true
        }

        return [
          user.displayName ?? "",
          user.name ?? "",
          user.email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(
            normalizedRecipientQuery
          )
      }
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
        key={conversation.id}
        type="button"
        onClick={() => {
          selectConversation(
            conversation.id
          )
        }}
        className={`w-full border-b border-neutral-900 px-3 py-3 text-left transition ${
          selected
            ? "bg-neutral-900"
            : archived
              ? "bg-neutral-950/40 hover:bg-neutral-950"
              : "bg-transparent hover:bg-neutral-950"
        }`}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          {unread ? (
            <span
              aria-label={`${conversation.unreadCount} unread`}
              className="mt-1 inline-flex min-w-4 shrink-0 items-center justify-center rounded-full border border-cyan-500/50 bg-cyan-500/15 px-1 py-0.5 text-[8px] font-medium text-cyan-300"
            >
              {conversation.unreadCount}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div
                className={`min-w-0 truncate text-[12px] font-medium leading-5 ${
                  archived
                    ? "text-neutral-400"
                    : "text-neutral-100"
                }`}
              >
                {conversationPrimaryLabel(
                  conversation,
                  currentUserId
                )}
              </div>

              <div className="shrink-0 pt-0.5 text-[8px] tabular-nums text-neutral-700">
                {formatConversationTime(
                  conversation.updatedAt
                )}
              </div>
            </div>

            <div className="mt-0.5 min-w-0 truncate text-[9px] uppercase tracking-[0.08em] text-neutral-600">
              {conversationSecondaryLabel(
                conversation,
                currentUserId
              )}
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-2">
              {conversation.operationalRoom ? (
                <span className="text-[8px] uppercase tracking-[0.15em] text-neutral-500">
                  {operationalRoomClassLabel(
                    conversation.operationalRoom.roomClass
                  )}
                </span>
              ) : null}

              {archived ? (
                <span className="shrink-0 rounded border border-neutral-800 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.1em] text-neutral-700">
                  Archived
                </span>
              ) : null}

              <div className="min-w-0 flex-1 truncate text-[10px] leading-4 text-neutral-600">
                {latest
                  ? latest.body
                  : "No messages yet"}
              </div>
            </div>
          </div>
        </div>
      </button>
    )
  }

  function renderRoomGovernance() {
    if (
      !selectedConversation ||
      !canManageConversations
    ) {
      return null
    }

    return (
      <section className="border-t border-neutral-800/80 px-4 py-3.5">
        <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
          Governance
        </div>

{selectedConversation.operationalRoom ? (
                    <div className="mt-3">
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
                            className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 transition hover:text-cyan-100"
                          >
                            {linkContextOpen
                              ? "Close Link Context"
                              : "Link Institutional Context"}
                          </button>

                          {linkContextOpen ? (
                            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-neutral-900 pt-3 sm:grid-cols-2">
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
          className="mt-4 w-full border-t border-neutral-900 pt-3 text-left text-[9px] uppercase tracking-[0.14em] text-neutral-600 transition hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
        >
          {changingConversationStatus
            ? "Updating"
            : conversationArchived
              ? "Reactivate Conversation"
              : "Archive Conversation"}
        </button>
      </section>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#080d13]">
      {linkedConversationError ? (
        <div role="alert" className="shrink-0 rounded-lg border border-amber-300/30 bg-amber-100/5 px-4 py-3 text-sm text-amber-100">
          {linkedConversationError}
        </div>
      ) : null}
      <div className={`relative bg-[#080d13] ${styles.console}`}>
      <aside
        className={`${styles.directory} ${
          selectedConversation
            ? styles.directorySelected
            : ""
        } ${
          responsiveContextOpen
            ? styles.directoryContextOpen
            : ""
        } bg-[#090f16]`}
      >
        <div className="border-b border-neutral-800 px-3 py-3">
          <div className="min-w-0">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Conversations
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-2">
                <div className="truncate text-xs text-neutral-400">
                  Institutional messaging
                </div>

                <span className="text-neutral-800">
                  ·
                </span>

                <span
                  className={`shrink-0 text-[8px] uppercase tracking-[0.14em] ${
                    realtime.connected
                      ? "text-emerald-400"
                      : "text-neutral-600"
                  }`}
                >
                  {realtime.connected
                    ? "Live"
                    : "Offline"}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                aria-expanded={creationSurfaceOpen}
                  onClick={() => {
                    if (
                      creationSurfaceOpen
                    ) {
                      setNewMenuOpen(false)
                      setDirectoryOpen(false)
                      setOperationalRoomOpen(false)
                      return
                    }

                    setDirectoryOpen(false)
                    setOperationalRoomOpen(false)
                    setNewMenuOpen(true)
                  }}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-neutral-300 transition hover:border-neutral-500 hover:text-white"
              >
                {creationSurfaceOpen
                  ? "Close"
                  : "+ New"}
              </button>
            </div>
          </div>
        </div>

        {conversations.length >= 5 ? (
          <div className="border-b border-neutral-900 px-3 py-2">
            <label className="block">
              <span className="sr-only">
                Search conversations
              </span>

              <input
                type="search"
                value={conversationQuery}
                onChange={event =>
                  setConversationQuery(
                    event.target.value
                  )
                }
                placeholder="Search conversations…"
                className="w-full rounded-md border border-neutral-800 bg-[#0b1118] px-2.5 py-2 text-[11px] text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-neutral-600"
              />
            </label>
          </div>
        ) : null}

        {newMenuOpen ? (
          <div className="border-b border-neutral-800 bg-[#0a0f15]">
            <button
              type="button"
              onClick={() => {
                setOperationalRoomOpen(
                  false
                )
                setNewMenuOpen(
                  false
                )
                void openDirectory()
              }}
              className="block w-full border-b border-neutral-900 px-3 py-3 text-left transition hover:bg-neutral-900/70"
            >
              <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-200">
                Start conversation
              </div>

              <div className="mt-1 text-[10px] leading-4 text-neutral-600">
                Direct institutional correspondence with an eligible participant.
              </div>
            </button>

            {canCreateOperationalRooms ? (
              <button
                type="button"
                onClick={() => {
                  setDirectoryOpen(
                    false
                  )
                  setNewMenuOpen(
                    false
                  )
                  void openOperationalRoom()
                }}
                className="block w-full px-3 py-3 text-left transition hover:bg-neutral-900/70"
              >
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-200">
                  Create operational room
                </div>

                <div className="mt-1 text-[10px] leading-4 text-neutral-600">
                  Governed coordination space with purpose, participants, and institutional context.
                </div>
              </button>
            ) : null}
          </div>
        ) : null}

        {operationalRoomOpen ? (
          <div className="border-b border-neutral-800 bg-neutral-950/80">
            <div className="space-y-3 px-4 py-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    Create Operational Room
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOperationalRoomOpen(false)
                      setDirectoryOpen(false)
                      setNewMenuOpen(true)
                    }}
                    className="shrink-0 text-[8px] uppercase tracking-[0.14em] text-neutral-600 transition hover:text-neutral-300"
                  >
                    Back to New
                  </button>
                </div>

                <div className="mt-1 text-xs leading-5 text-neutral-600">
                  Establish a governed coordination space for a defined purpose. Creating a room does not grant authority or execute institutional action.
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
                      No additional authorized participants are currently available for this room.
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
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Start Conversation
              </div>

              <button
                type="button"
                onClick={() => {
                  setDirectoryOpen(false)
                  setOperationalRoomOpen(false)
                  setNewMenuOpen(true)
                }}
                className="text-[8px] uppercase tracking-[0.14em] text-neutral-600 transition hover:text-neutral-300"
              >
                Back to New
              </button>
            </div>

            <div className="border-t border-neutral-900 px-4 py-2">
              <label className="block">
                <span className="sr-only">
                  Search eligible recipients
                </span>

                <input
                  type="search"
                  value={recipientQuery}
                  onChange={event =>
                    setRecipientQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search people…"
                  className="w-full rounded-md border border-neutral-800 bg-[#0b1118] px-2.5 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-neutral-600"
                />
              </label>
            </div>

            <div className="max-h-[260px] overflow-y-auto border-t border-neutral-900">
              {loadingDirectory ? (
                <div className="px-4 py-4 text-sm text-neutral-500">
                  Loading people…
                </div>
              ) : filteredDirectoryUsers.length === 0 ? (
                <div className="px-4 py-4 text-sm text-neutral-500">
                  No eligible recipients.
                </div>
              ) : (
                filteredDirectoryUsers.map(
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
              <div className="border-b border-neutral-900 bg-neutral-950/60 px-3 py-2">
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
                filteredActiveConversations.map(
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

                  {filteredArchivedConversations.map(
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

      <section
        className={`${styles.stage} ${
          selectedConversation
            ? styles.stageSelected
            : styles.stageEmpty
        } ${
          responsiveContextOpen
            ? styles.stageContextOpen
            : ""
        } bg-[#0a1017]`}
      >
        {selectedConversation ? (
          <>
            <div className={`${styles.threadMasthead} border-b border-neutral-800 bg-[#0b121a] px-3 py-2.5 sm:px-4 sm:py-3`}>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      selectConversation(null)
                      setResponsiveContextOpen(false)
                    }}
                    className={`${styles.mobileBack} mt-0.5 shrink-0 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400 transition hover:border-neutral-500 hover:text-white`}
                    aria-label="Back to conversations"
                  >
                    Back
                  </button>

                  <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="truncate text-[8px] uppercase tracking-[0.14em] text-neutral-600 sm:text-[10px]">
                      {selectedConversation.operationalRoom
                        ? "Operational Room"
                        : "Direct"}
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

                  <div className="mt-1 min-w-0">
                    <div className="truncate text-sm font-medium text-white sm:hidden">
                      {conversationPrimaryLabel(
                        selectedConversation,
                        currentUserId
                      )}
                    </div>

                    <div className="mt-0.5 truncate text-[8px] uppercase tracking-[0.11em] text-neutral-600 sm:hidden">
                      {conversationSecondaryLabel(
                        selectedConversation,
                        currentUserId
                      )}
                    </div>

                    <div className="hidden truncate text-[15px] font-medium text-white sm:block">
                      {conversationLabel(
                        selectedConversation,
                        currentUserId
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-expanded={
                  responsiveContextOpen
                }
                aria-controls="communications-responsive-context"
                onClick={() => {
                  setResponsiveContextOpen(
                    current =>
                      !current
                  )
                }}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400 transition hover:border-neutral-500 hover:text-white sm:px-3 sm:py-2 sm:text-[10px]"
              >
                Context
              </button>
            </div>
              </div>
            </div>

            <div className={`${styles.timeline} flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-5`}>
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
                            className={`${styles.messageBubble} ${
                              own
                                ? `${styles.messageBubbleOwn} border-slate-600/55 bg-[#121a23]`
                                : "border-neutral-700/70 bg-[#0b1016]"
                            } rounded-lg border px-3 py-2 sm:px-4 sm:py-3`}
                          >
                            <div className={`${styles.messageMeta} mb-1.5 flex items-center gap-2.5 text-[9px] uppercase tracking-[0.14em] text-neutral-600`}>
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

                            <div className="whitespace-pre-wrap break-words text-[13px] leading-5 text-neutral-100 sm:text-[14px] sm:leading-6">
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

            <div className="shrink-0 border-t border-neutral-700/80 bg-[#080d13] px-3 py-2 sm:px-4 sm:py-2.5">
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
                  <div className={`${styles.composerShell} bg-[#080d13]`}>
                    <div className={`${styles.composerMetaRow} flex min-w-0 items-center gap-3 border-b border-neutral-800/70 py-2`}>
                      <span className="shrink-0 text-[8px] uppercase tracking-[0.16em] text-neutral-700">
                        Classification
                      </span>

                      <label className="min-w-0 overflow-hidden">
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
                          className="min-w-0 max-w-[180px] cursor-pointer appearance-none truncate rounded-md border border-slate-800 bg-[#0d141c] px-2.5 py-1.5 text-left text-[9px] uppercase tracking-[0.14em] text-slate-300 outline-none focus:border-cyan-800/60 disabled:cursor-wait disabled:opacity-60"
                          style={{
                            colorScheme: "dark",
                            backgroundColor: "#0d141c",
                            color: "#cbd5e1",
                          }}
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
                      <div className={`${styles.composerMetaRow} flex min-w-0 items-center gap-3 border-b border-neutral-800/70 py-2`}>
                         <span className="shrink-0 text-[8px] uppercase tracking-[0.16em] text-neutral-700">
                           Message Link
                         </span>

                        <label className="min-w-0 overflow-hidden">
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
                            aria-label="Message link"
                            className="min-w-0 flex-1 cursor-pointer appearance-none truncate rounded-md border border-slate-800 bg-[#0d141c] px-2.5 py-1.5 text-left text-[9px] uppercase tracking-[0.12em] text-slate-300 outline-none focus:border-cyan-800/60 disabled:cursor-wait disabled:opacity-60"
                            style={{
                              colorScheme: "dark",
                              backgroundColor: "#0d141c",
                              color: "#cbd5e1",
                            }}
                          >
                            <option value="">
                              No linked object
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

                    <div className={`${styles.composerEntryRow} flex flex-col gap-2 pt-2.5 sm:flex-row sm:items-stretch sm:gap-2`}>
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
                        className={`${styles.composerBody} min-h-[56px] max-h-[150px] resize-y rounded-md border border-slate-700/50 bg-[#0d141c] px-3 py-2 text-sm leading-6 text-slate-100 caret-cyan-200 outline-none placeholder:text-slate-500 selection:bg-cyan-300/20 focus:border-cyan-700/60 focus:bg-[#0f1822] disabled:cursor-wait disabled:opacity-70`}
                        style={{
                          color: "#eef4fb",
                          backgroundColor: "#0b1118",
                          caretColor: "#9bd7f2",
                          WebkitTextFillColor: "#eef4fb",
                          colorScheme: "dark",
                        }}
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
                        className={`${styles.sendButton} shrink-0 rounded-md border border-cyan-700/45 bg-cyan-950/30 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-500/70 hover:bg-cyan-950/55 hover:text-white disabled:border-neutral-800 disabled:bg-neutral-950 disabled:text-neutral-700 disabled:cursor-not-allowed`}
                      >
                        {sending
                          ? "Sending"
                          : "Send"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-1.5 hidden px-1 text-[8px] uppercase tracking-[0.14em] text-neutral-700 sm:block">
                    Enter to send · Shift + Enter for line break
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-8">
            <div className="max-w-md text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">
                Communications
              </div>
              <div className="mt-3 text-base font-medium text-neutral-300">
                Select a conversation
              </div>
              <p className="mt-2 text-xs leading-6 text-neutral-600">
                Open a conversation from the rail to review its durable history,
                operational context, and correspondence. Previewing the list does
                not mark messages as read.
              </p>
            </div>
          </div>
        )}
      </section>

      {selectedConversation &&
      responsiveContextOpen ? (
        <>
          <button
            type="button"
            aria-label="Close room context"
            onClick={() => {
              setResponsiveContextOpen(
                false
              )
            }}
            className={`${styles.contextOverlay} absolute inset-0 z-40 bg-black/55 backdrop-blur-[1px]`}
          />

          <aside
            id="communications-responsive-context"
            aria-label="Room context"
            className={`${styles.contextInspector} z-50 flex flex-col border-l border-neutral-700/80 bg-[#090f16] shadow-2xl`}
          >
            <div className="shrink-0 border-b border-neutral-800 px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                    Room Context
                  </div>

                  <div className="mt-2 truncate text-sm font-medium text-neutral-200">
                    {conversationPrimaryLabel(
                      selectedConversation,
                      currentUserId
                    )}
                  </div>

                  <div className="mt-1 truncate text-[9px] uppercase tracking-[0.12em] text-neutral-600">
                    {conversationSecondaryLabel(
                      selectedConversation,
                      currentUserId
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                      {selectedConversation.operationalRoom
                        ? operationalRoomClassLabel(
                            selectedConversation.operationalRoom.roomClass
                          )
                        : "Direct"}
                    </span>

                    <span className="text-neutral-800">
                      ·
                    </span>

                    <span className={`text-[8px] uppercase tracking-[0.14em] ${
                      conversationArchived
                        ? "text-neutral-600"
                        : "text-emerald-400"
                    }`}>
                      {conversationArchived
                        ? "Archived"
                        : "Active"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close room context"
                  onClick={() => {
                    setResponsiveContextOpen(
                      false
                    )
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-black/20 text-sm text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {selectedConversation.operationalRoom ? (
                <div className="border-b border-neutral-800 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                      Institutional Context
                    </div>

                    <div className="text-[9px] tabular-nums text-neutral-700">
                      {selectedConversation.operationalRoom.links.length}
                    </div>
                  </div>

                  {selectedConversation.operationalRoom.links.length >
                  0 ? (
                    <div className="mt-2 divide-y divide-neutral-900">
                      {selectedConversation.operationalRoom.links.map(
                        link => (
                          <div
                            key={
                              link.id
                            }
                            title={
                              `${link.targetSubtype} · ${link.targetId}`
                            }
                            className="py-2.5"
                          >
                            <div className="text-[9px] uppercase tracking-[0.13em] text-neutral-400">
                              {operationalTargetLabel(
                                link
                              )}
                            </div>

                            <div className="mt-1 truncate font-mono text-[10px] text-neutral-600">
                              {link.targetId}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs leading-5 text-neutral-600">
                      No institutional objects are linked to this room.
                    </div>
                  )}
                </div>
              ) : null}

              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-600">
                    Participants
                  </div>

                  <div className="text-[9px] tabular-nums text-neutral-700">
                    {
                      selectedConversation.members.filter(
                        member =>
                          member.leftAt ===
                          null
                      ).length
                    }
                  </div>
                </div>

                <div className="mt-2 divide-y divide-neutral-900">
                  {selectedConversation.members
                    .filter(
                      member =>
                        member.leftAt ===
                        null
                    )
                    .map(
                      member => (
                        <div
                          key={
                            member.id
                          }
                          className="py-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-xs text-neutral-300">
                                {member.userId ===
                                currentUserId
                                  ? "You"
                                  : userLabel(
                                      member.user
                                    )}
                              </div>

                              <div className="mt-0.5 truncate text-[10px] text-neutral-700">
                                {member.user.email}
                              </div>
                            </div>

                            <div className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-neutral-700">
                              {member.role}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>

              {renderRoomGovernance()}
            </div>

            <div className="shrink-0 border-t border-neutral-800 px-4 py-3">
              <div className="text-[9px] leading-4 text-neutral-700">
                Room context is informational. Institutional authority remains
                governed by the linked authoritative domain.
              </div>
            </div>
          </aside>
        </>
      ) : null}

      </div>
    </div>
  )
}
