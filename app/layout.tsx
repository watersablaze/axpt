import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css"; // ✅ Correct relative path

import SessionProviderWrapper from "../components/SessionProviderWrapper";
import CleanupTask from "../components/CleanupTask";

// Google Fonts (still intact)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Optional: You can also consider putting the metadata object into a separate file if it expands.
export const metadata: Metadata = {
  title: "Axis Point",
  description: "The Crossroads of Technology, Trade, and Cultural Exchange",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <CleanupTask />
      </body>
    </html>
  );
}