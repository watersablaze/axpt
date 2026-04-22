import Link from "next/link";
import { transmissions } from "@/lib/mainstream/transmissions";

export default function UpcomingTransmission() {
  const upcoming = transmissions.find((transmission) => transmission.status === "draft");

  return (
    <section className="ms-section upcoming">
      <div className="ms-container">
        <h3>Upcoming Transmission</h3>
        {upcoming ? (
          <div className="ms-card">
            <p className="ms-registry">{upcoming.registry}</p>
            <h4>{upcoming.title}</h4>
            <p>{upcoming.abstract}</p>
            <div className="ms-ledger-meta">
              <span>{upcoming.channel}</span>
              <span>{upcoming.date}</span>
              <span>{upcoming.location}</span>
            </div>
            <Link
              href={`/mainstream/transmissions/${upcoming.id}`}
              className="ms-link"
            >
              Open Draft Record →
            </Link>
          </div>
        ) : (
          <p className="ms-empty">No upcoming transmissions scheduled.</p>
        )}
      </div>
    </section>
  );
}
