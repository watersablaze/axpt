export async function detectOwncastBaseUrl(): Promise<string> {
  // 1. ENV variable always wins
  if (process.env.OWNCAST_URL) return process.env.OWNCAST_URL;

  // 2. Docker-style hostname (if using docker-compose)
  try {
    const res = await fetch('http://owncast:8080/api/health', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) return 'http://owncast:8080';
  } catch {}

  // 3. Try localhost (local dev)
  try {
    const res = await fetch('http://localhost:8080/api/health', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) return 'http://localhost:8080';
  } catch {}

  // 4. Fallback
  return 'http://localhost:8080';
}