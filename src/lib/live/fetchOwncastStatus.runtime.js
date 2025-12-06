// src/lib/live/fetchOwncastStatus.runtime.js

// Load the JS output, not the TS source.
// Node can import this safely.

async function fetchOwncastStatus() {
  const mod = await import("./fetchOwncastStatus.js");
  return mod.fetchOwncastStatus();
}

module.exports = { fetchOwncastStatus };