import Link from "next/link";
import { transmissions } from "@/lib/mainstream/transmissions";

export default function TransmissionLedger() {
  return (
    <section className="ms-section ledger">
      <div className="ms-container">
        <h3>Transmission Ledger</h3>
        <div className="ms-stack">
          {transmissions.map((transmission) => (
            <Link
              key={transmission.id}
              href={`/mainstream/transmissions/${transmission.id}`}
              className="ms-card ms-card--link"
            >
              <div className="ms-split">
                <div>
                  <p className="ms-registry">{transmission.registry}</p>
                  <h4>{transmission.title}</h4>
                </div>

                <div className="ms-ledger-meta">
                  <span>{transmission.channel}</span>
                  <span>{transmission.location}</span>
                  <span>{transmission.date}</span>
                  <span className={`ms-status ms-status--${transmission.status}`}>
                    {transmission.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
