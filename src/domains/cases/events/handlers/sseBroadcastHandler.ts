import { CaseDomainEvent } from "../caseEvents"

type Client = {
  send: (data: string) => void
}

const clients: Client[] = []

export function registerSSEClient(client: Client) {
  clients.push(client)
}

export function unregisterSSEClient(client: Client) {
  const index = clients.indexOf(client)
  if (index !== -1) {
    clients.splice(index, 1)
  }
}

export function sseBroadcastHandler(event: CaseDomainEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`

  for (const client of clients) {
    client.send(payload)
  }
}