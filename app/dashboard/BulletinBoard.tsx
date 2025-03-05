"use client";

import { useEffect, useState } from "react";
import GoldPrice from "./GoldPrice"; // ✅ Import Gold Price Component
import styles from "./BulletinBoard.module.css";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
}

export default function BulletinBoard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Manually curated news updates
  const newsUpdates: NewsItem[] = [
    { id: 1, title: "Gold Prices Surge", description: "Gold prices hit a 5-year high amid economic uncertainty.", date: "Feb 20, 2025" },
    { id: 2, title: "Stablecoins Gaining Popularity", description: "More investors are turning to stablecoins as a safe haven.", date: "Feb 18, 2025" },
    { id: 3, title: "Crypto Regulation Update", description: "Governments are setting new guidelines for crypto trading.", date: "Feb 15, 2025" },
  ];

  // ✅ Auto-scroll through news items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsUpdates.length);
    }, 8000); // ✅ Switch news every 8 seconds
    return () => clearInterval(interval);
  }, [newsUpdates.length]);

  return (
    <div className={styles.bulletinContainer}>

<div className={styles.bulletinContainer}>
      <h2 className={styles.bulletinTitle}>Market Updates & Financial News</h2>

      {/* ✅ Gold Price Now in Bulletin Section */}
      <div className={styles.goldPriceSection}>
        <GoldPrice />
      </div>

      <p className={styles.bulletinDescription}>
        Stay informed with real-time market trends and updates on financial movements.
      </p>

      {/* ✅ Other Bulletin Content Can Go Here */}
    </div>
    
      <h2 className={styles.bulletinTitle}>Latest Financial & Crypto Insights</h2>
      <div className={styles.newsItem}>
        <h3>{newsUpdates[currentIndex].title}</h3>
        <p>{newsUpdates[currentIndex].description}</p>
        <span className={styles.newsDate}>{newsUpdates[currentIndex].date}</span>
      </div>
    </div>
  );
}