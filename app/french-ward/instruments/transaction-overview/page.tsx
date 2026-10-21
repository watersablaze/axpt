import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FrenchWardTransactionOverviewView } from "@/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Gold Supply & Transaction Overview | French-Ward",
  robots: { index: false, follow: false },
};

/** Instrument presentation during local development; publication pending. */
export default async function TransactionOverviewDevelopmentPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const host = (await headers()).get("host") ?? "";
  let hostname = "";
  try { hostname = new URL(`http://${host}`).hostname; } catch { notFound(); }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) notFound();
  return <div style={{ padding: "24px 0", minWidth: 0 }}>
    <p style={{ maxWidth: 1020, margin: "0 auto 16px", padding: "0 20px", fontSize: 12, color: "#aebdc5" }}>
      Development review · current generic presentation · representative attribution appears only on its reviewed CUP copy
    </p>
    <FrenchWardTransactionOverviewView />
  </div>;
}
