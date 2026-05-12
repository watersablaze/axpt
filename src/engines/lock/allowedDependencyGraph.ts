export const allowedGraph: Record<string, string[]> = {
  // UI LAYER
  "ui": [
    "client",
  ],

  // CLIENT LAYER
  "client": [
    "stream",
  ],

  // STREAM LAYER
  "stream": [
    "governance",
    "trace",
    "graph",
  ],

  // GOVERNANCE
  "governance": [
    "trace",
  ],

  // TRACE (write-only)
  "trace": [],

  // GRAPH (read-only from trace + stream)
  "graph": [
    "trace",
  ],

  // SERVER CORE
  "execution": [
    "governance",
    "trace",
    "graph",
  ],
}