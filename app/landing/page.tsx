"use client";

import styles from "./Landing.module.css";
import Hero from "./components/Hero"; 
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export const metadata = {
  title: "AXPT - The Future of Tech & Trade",
  description: "A seamless ecosystem connecting blockchain, trade, and cultural exchange.",
  keywords: "blockchain, trade, fintech, cultural exchange, investments, digital assets",
  openGraph: {
    title: "AXPT - The Future of Tech & Trade",
    description: "Empowering global connections with decentralized finance.",
    url: "https://axpt.io",
    siteName: "AXPT.io",
    images: [
      {
        url: "/AXI.png",
        width: 1200,
        height: 630,
        alt: "AXPT Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AXPT - The Future of Tech & Trade",
    description: "Join AXPT and revolutionize global trade and digital finance.",
    images: ["/AXI.png"],
  },
};

export default function LandingPage() {
  return (
    <main className={styles.landingContainer}>
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}