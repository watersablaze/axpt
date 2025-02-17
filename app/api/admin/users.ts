import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ✅ Mock user data (Replace with real database fetch)
    const users = [
      { id: "1", name: "Admin User", email: "admin@example.com", isAdmin: true },
      { id: "2", name: "Test User", email: "user@example.com", isAdmin: false }
    ];

    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}