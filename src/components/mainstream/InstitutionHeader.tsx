// src/components/mainstream/InstitutionHeader.tsx

export default function InstitutionHeader({
  status,
}: {
  status?: string;
}) {
  const isLive = status === "live";

  return (
    <section
      className={`ms-signal-rail ${
        isLive ? "ms-signal-rail--live" : "ms-signal-rail--dark"
      }`}
    >
      <div className="ms-signal-inner">

        <span className="ms-signal-label">STATUS</span>

        {isLive ? (
          <>
            <span className="ms-live-dot" />
            <span className="ms-signal-value">LIVE TRANSMISSION</span>
          </>
        ) : (
          <span className="ms-signal-value">ARCHIVED RECORD</span>
        )}

        <span className="ms-signal-separator">|</span>

        <span className="ms-signal-label">MODE</span>
        <span className="ms-signal-value">
          CULTURAL SIGNAL TOWER
        </span>

      </div>
    </section>
  );
}