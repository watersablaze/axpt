export interface OwncastStatus {
  online: boolean;
  viewerCount: number;
  lastConnectTime: number | null;
  sessionPeakViewerCount?: number;
  overallPeakViewerCount?: number;
  broadcaster?: {
    viewerCount?: number;
    bitrate?: number;
    bitrateKbps?: number;
  };
}

export async function fetchOwncastStatus() {
  const base = process.env.OWNCAST_STATUS_URL;

  if (!base) {
    console.error("[Owncast] Missing OWNCAST_STATUS_URL");
    const fallback: OwncastStatus = {
      online: false,
      viewerCount: 0,
      lastConnectTime: null
    };
    return fallback;
  }

  try {
    const res = await fetch(base, { cache: "no-store" });
    if (!res.ok) throw new Error("Owncast status fetch failed");

    const json = await res.json();

    const payload: OwncastStatus = {
      online: json?.online ?? false,
      viewerCount: json?.viewerCount ?? 0,
      lastConnectTime: json?.lastConnectTime ?? null,
      sessionPeakViewerCount: json?.sessionPeakViewerCount,
      overallPeakViewerCount: json?.overallPeakViewerCount,
      broadcaster: json?.broadcaster,
    };

    return payload;
  } catch (err) {
    console.error("[Owncast] fetch error", err);
    const fallback: OwncastStatus = {
      online: false,
      viewerCount: 0,
      lastConnectTime: null
    };
    return fallback;
  }
}
