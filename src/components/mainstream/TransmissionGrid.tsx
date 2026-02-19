import Link from "next/link";
import styles from "./TransmissionGrid.module.css";
import { transmissions } from "@/lib/mainstream/transmissions";

export default function TransmissionGrid() {
  const items = transmissions.filter((t) => !t.pinned);

  if (!items.length) return null;

  return (
    <section className="ms-section">
      <div className="ms-container">

        <h3 className={styles.gridTitle}>
          transmissions
        </h3>

        <div className={styles.grid}>
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/mainstream/transmissions/${t.id}`}
              className={styles.card}
            >
              <div
                className={styles.thumbnail}
                style={{
                  backgroundImage: `url(${t.image})`,
                }}
              />

              <div className={styles.cardMeta}>
                <p className="ms-registry">{t.registry}</p>
                <p className={styles.cardTitle}>{t.title}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}