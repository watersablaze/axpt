export async function fetchOwncastStatus() {
  const base = process.env.OWNCAST_STATUS_URL;

  if (!base) {
    console.error("[Owncast] Missing OWNCAST_STATUS_URL");
    return {
      online: false,
      viewerCount: 0,
      lastConnectTime: null
    };
  }

  try {
    const res = await fetch(base, { cache: "no-store" });
    if (!res.ok) throw new Error("Owncast status fetch failed");

    const json = await res.json();

    return {
      online: json?.online ?? false,
      viewerCount: json?.viewerCount ?? 0,
      lastConnectTime: json?.lastConnectTime ?? null,
    };

  } catch (err) {
    console.error("[Owncast] fetch error", err);
    return {
      online: false,
      viewerCount: 0,
      lastConnectTime: null
    };
  }
}