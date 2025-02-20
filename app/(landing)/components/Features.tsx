"use client";

import styles from "./Features.module.css";

const features = [
  { title: "Blockchain Security", description: "Your assets and identity secured with next-gen encryption." },
  { title: "Gold-backed Stability", description: "A financial system tied to real assets." },
  { title: "Cultural Exchange", description: "Trade, collaborate, and connect worldwide." }
];

export default function Features() {
  return (
    <section className={styles.features}>
      {features.map((feature, index) => (
        <div key={index} className={styles.featureCard}>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </section>
  );
}