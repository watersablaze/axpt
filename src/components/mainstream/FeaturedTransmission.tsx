import Link from "next/link";
import styles from "./FeaturedTransmission.module.css";
import { transmissions } from "@/lib/mainstream/transmissions";

export default function FeaturedTransmission() {
  const featured =
    transmissions.find((t) => t.pinned) ?? transmissions[0];

  if (!featured) return null;

  return (
    <section className="ms-section ms-section--featured">

      {/* Full Width Signal Frame */}
      <div className={styles.signalFrame}>
        <div
          className={styles.imageBlock}
          style={{
            backgroundImage: `url(${featured.image})`,
          }}
        />

        <div className={styles.signalMeta}>
          <p className="ms-registry">{featured.registry}</p>

          <h2 className={styles.featuredTitle}>
            {featured.title}
          </h2>

          <div className={styles.metaRow}>
            <span>Location — {featured.location}</span>
            <span>Date — {featured.date}</span>
            <span>Status — {featured.status}</span>
          </div>
        </div>
      </div>

      {/* Structured Detail Block */}
      <div className="ms-container">
        <div className={styles.detailBlock}>
          <p className={styles.abstract}>
            {featured.abstract}
          </p>

          <div className={styles.actionRow}>
            <Link
              href={`/mainstream/transmissions/${featured.id}`}
              className="ms-link"
            >
              Enter Transmission →
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}
