type EventHandler = (payload: any) => Promise<void>

const handlers: Record<string, EventHandler[]> = {}

export function on(event: string, handler: EventHandler) {
  if (!handlers[event]) handlers[event] = []
  handlers[event].push(handler)
}

export async function emit(event: string, payload: any) {
  const list = handlers[event] || []

  for (const handler of list) {
    await handler(payload)
  }
}