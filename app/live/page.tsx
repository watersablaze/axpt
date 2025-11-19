import { getLiveState } from "@/lib/live/getLiveState";
import { LiveAttach } from "@/components/Live/LiveAttach";
import { TokenGate } from "@/components/TokenGate";

export default async function LivePage() {
  const { isLive, owncastHls, fallbackHls } = await getLiveState();
  const src = isLive ? owncastHls : fallbackHls;

  return (
    <TokenGate>
      <section className="px-4 py-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-semibold mb-4">AXPT Live</h1>
        <video
          id="axpt-live"
          className="w-full max-w-5xl aspect-video rounded-2xl shadow-xl"
          controls
          autoPlay
          playsInline
        >
          <source src={src} type="application/vnd.apple.mpegurl" />
        </video>
        {/* @ts-expect-error */}
        <LiveAttach videoId="axpt-live" />
        <p className="mt-4 text-sm text-neutral-400">
          {isLive ? "Broadcasting via AXPT Live" : "Offline / Standby"}
        </p>
      </section>
    </TokenGate>
  );
}