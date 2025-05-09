import "../styles/globals.css"; // ✅ Clean absolute import
import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AXPT - The Future of Tech & Trade",
  description: "A seamless ecosystem connecting blockchain, trade, and cultural exchange.",
  metadataBase: new URL("https://axpt.io"), // ✅ Ensures correct Open Graph/Twitter previews
  keywords: "blockchain, trade, fintech, cultural exchange, investments, digital assets",
  openGraph: {
    title: "AXPT - The Future of Tech & Trade",
    description: "Empowering global connections with decentralized finance.",
    url: "https://axpt.io",
    siteName: "AXPT.io",
    images: [
      {
        url: "https://axpt.io/AXI.png", // ✅ Ensure absolute URL for social previews
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
    images: ["https://axpt.io/AXI.png"], // ✅ Ensure absolute URL
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}