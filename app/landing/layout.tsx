import "./globals.css"; // Import global styles
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AXPT - Future of Tech & Trade",
  description: "A seamless ecosystem connecting blockchain, trade, and culture.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}