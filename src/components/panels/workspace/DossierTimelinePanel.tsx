'use client'

type DossierEvent = {
  id: string
  eventType: string
  message: string
  actor: string | null
  createdAt: string
}

type Props = {
  currentState: string
  events: DossierEvent[]
}

const STATES = [
  'INTAKE_PENDING',
  'KYC_REVIEW',
  'SPA_DRAFTING',
  'SPA_EXECUTED',
  'ESCROW_PENDING',
  'ESCROW_FUNDED',
  'TREASURY_PENDING',
  'EXPORT_RELEASED',
  'EXPORT_ACTIVE',
  'IN_TRANSIT',
  'REFINERY_INTAKE',
  'REFINERY_ASSAY',
  'ASSAY_PENDING',
  'SETTLEMENT_PENDING',
  'SETTLED',
  'CLOSED',
]

const INSTRUMENT_EVENTS = new Set([
  'INSTRUMENT_GENERATED',
  'INSTRUMENT_STATUS_CHANGED',
  'DOSSIER_INSTRUMENT_DRAFTED',
])

const STATE_EVENTS = new Set([
  'DOSSIER_STATE_TRANSITIONED',
])

const PARTY_EVENTS = new Set([
  'DOSSIER_PARTIES_SEEDED',
])

function formatTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function eventTone(eventType: string) {
  if (INSTRUMENT_EVENTS.has(eventType)) {
    return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }

  if (STATE_EVENTS.has(eventType)) {
    return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
  }

  if (PARTY_EVENTS.has(eventType)) {
    return 'border-amber-900 bg-amber-950/20 text-amber-300'
  }

  return 'border-neutral-800 bg-black/30 text-neutral-400'
}

function classifyEvents(events: DossierEvent[]) {
  return {
    stateEvents: events.filter((event) =>
      STATE_EVENTS.has(event.eventType)
    ),
    instrumentEvents: events.filter((event) =>
      INSTRUMENT_EVENTS.has(event.eventType)
    ),
    partyEvents: events.filter((event) =>
      PARTY_EVENTS.has(event.eventType)
    ),
    dossierEvents: events.filter(
      (event) =>
        !STATE_EVENTS.has(event.eventType) &&
        !INSTRUMENT_EVENTS.has(event.eventType) &&
        !PARTY_EVENTS.has(event.eventType)
    ),
  }
}

function EventCard({ event }: { event: DossierEvent }) {
  return (
    <div className="rounded border border-neutral-800 bg-black/30 p-3 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-neutral-200">
            {event.message}
          </div>

          <div className="mt-2 text-[10px] uppercase tracking-wide text-neutral-600">
            {formatTime(event.createdAt)}
            {event.actor ? ` · ${event.actor}` : ''}
          </div>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${eventTone(
            event.eventType
          )}`}
        >
          {event.eventType}
        </div>
      </div>
    </div>
  )
}

function EventGroup({
  title,
  description,
  events,
}: {
  title: string
  description: string
  events: DossierEvent[]
}) {
  return (
    <section className="rounded border border-neutral-800 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
            {title}
          </h4>

          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
            {description}
          </p>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
          {events.length} Events
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-600">
          No events recorded.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function DossierTimelinePanel({
  currentState,
  events,
}: Props) {
  const currentIndex = STATES.indexOf(currentState)
  const {
    stateEvents,
    instrumentEvents,
    partyEvents,
    dossierEvents,
  } = classifyEvents(events)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Commercial Timeline
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {STATES.map((state, index) => {
            const isCurrent = state === currentState
            const isPast =
              currentIndex >= 0 && index < currentIndex

            return (
              <div
                key={state}
                className="flex items-center gap-2 rounded border border-neutral-900 bg-black/20 p-2 text-xs"
              >
                <div
                  className={
                    isCurrent
                      ? 'h-2.5 w-2.5 rounded-full bg-cyan-300'
                      : isPast
                        ? 'h-2.5 w-2.5 rounded-full bg-emerald-400'
                        : 'h-2.5 w-2.5 rounded-full border border-neutral-700'
                  }
                />

                <div
                  className={
                    isCurrent
                      ? 'text-cyan-300'
                      : isPast
                        ? 'text-emerald-300'
                        : 'text-neutral-500'
                  }
                >
                  {state}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Event Feed
            </div>

            <h3 className="mt-1 text-sm font-medium text-white">
              Dossier Activity Ledger
            </h3>

            <p className="mt-1 max-w-2xl text-xs text-neutral-500">
              Grouped audit events from state transitions, instruments,
              party readiness, and dossier operations.
            </p>
          </div>

          <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {events.length} Events
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <div className="rounded border border-emerald-900/60 bg-emerald-950/10 p-2 text-[11px] text-emerald-300">
            {stateEvents.length} State
          </div>
          <div className="rounded border border-cyan-900/60 bg-cyan-950/10 p-2 text-[11px] text-cyan-300">
            {instrumentEvents.length} Instrument
          </div>
          <div className="rounded border border-amber-900/60 bg-amber-950/10 p-2 text-[11px] text-amber-300">
            {partyEvents.length} Party
          </div>
          <div className="rounded border border-neutral-800 bg-black/30 p-2 text-[11px] text-neutral-400">
            {dossierEvents.length} Dossier
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <EventGroup
            title="Instrument Events"
            description="Drafting, activation, execution, archival, and generated instrument records."
            events={instrumentEvents}
          />

          <EventGroup
            title="State Transitions"
            description="Formal movement through the commercial execution timeline."
            events={stateEvents}
          />

          <EventGroup
            title="Party / Readiness Events"
            description="Party seeding, identity context, and readiness-related events."
            events={partyEvents}
          />

          <EventGroup
            title="Dossier Events"
            description="General dossier creation and operational events."
            events={dossierEvents}
          />
        </div>
      </div>
    </div>
  )
}
