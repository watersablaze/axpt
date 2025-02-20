import { NextResponse } from "next/server";

// Mock price API call
export async function GET() {
  try {
    // Replace with actual API call to Chainlink oracle
    const mockPrice = 65.32; // 1g Gold price in USD
    return NextResponse.json({ price: mockPrice });
  } catch (error) {
    console.error("❌ Failed to fetch gold price:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}