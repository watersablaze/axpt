"use client";

import { useEffect, useState } from "react";
import styles from "./GoldPrice.module.css";

export default function GoldPrice() {
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoldPrice() {
      try {
        console.log("🔄 Fetching gold price...");
        const response = await fetch("/api/gold-price");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Gold Price Data:", data);

        setGoldPrice(data.price);
      } catch (error) {
        console.error("❌ Error fetching gold price:", error);
        setGoldPrice(null);
      } finally {
        setLoading(false);
      }
    }

    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 60000); // Refresh every 60s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.goldPriceContainer}>
      {loading ? (
        <span className={styles.loading}>Fetching price...</span>
      ) : goldPrice ? (
        <span className={styles.price}>
          Live Gold Price: 1g Gold = <strong>${goldPrice.toFixed(2)}</strong>
        </span>
      ) : (
        <span className={styles.error}>⚠️ Price Unavailable</span>
      )}
    </div>
  );
}