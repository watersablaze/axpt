import type { Metadata } from "next";
import { Geist, Geist_Mono, Fira_Code } from "next/font/google"; // 🟢 Add Fira_Code here
import "./styles/globals.css";

import SessionProviderWrapper from "../components/SessionProviderWrapper";
import CleanupTask from "../components/CleanupTask";

// Google Fonts (using Next.js font loader)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"], // 🟢 Choose weights as needed
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${firaCode.variable}`}
      >
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <CleanupTask />
      </body>
    </html>
  );
}