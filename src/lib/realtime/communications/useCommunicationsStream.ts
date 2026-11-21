"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

export type CommunicationRealtimeSignal = {
  id: string

  type:
    | "COMMUNICATION_CONVERSATION_CREATED"
    | "COMMUNICATION_MESSAGE_SENT"
    | "COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE"

  conversationId: string
  messageId?: string
  senderUserId?: string

  reflectionId?: string
  operationalRoomId?: string

  createdAt: string
}

type CommunicationsRealtimeState = {
  connected: boolean
  lastSignal: CommunicationRealtimeSignal | null
  revision: number
}

const initialState: CommunicationsRealtimeState = {
  connected: false,
  lastSignal: null,
  revision: 0,
}

export function useCommunicationsStream(
  endpoint = "/api/communications/stream",
  enabled = true
) {
  const [state, setState] =
    useState<CommunicationsRealtimeState>(
      initialState
    )

  const seenIds =
    useRef(
      new Set<string>()
    )

  useEffect(() => {
    if (!enabled) {
      seenIds.current.clear()
      setState(initialState)
      return
    }

    const source =
      new EventSource(
        endpoint
      )

    source.onopen = () => {
      setState(
        (previous) => ({
          ...previous,
          connected: true,
        })
      )
    }

    source.onmessage = (
      event
    ) => {
      const signal =
        JSON.parse(
          event.data
        ) as CommunicationRealtimeSignal

      if (
        seenIds.current.has(
          signal.id
        )
      ) {
        return
      }

      seenIds.current.add(
        signal.id
      )

      setState(
        (previous) => ({
          connected: true,
          lastSignal: signal,
          revision:
            previous.revision + 1,
        })
      )
    }

    source.onerror = () => {
      setState(
        (previous) => ({
          ...previous,
          connected: false,
        })
      )

      /*
       * Do not close here.
       * Native EventSource reconnection
       * remains available.
       */
    }

    return () => {
      source.close()
    }
  }, [endpoint, enabled])

  return state
}
