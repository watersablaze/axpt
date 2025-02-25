import { NextResponse } from "next/server";

// Placeholder for future Prisma connection if email subscription is re-enabled
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // ✅ Validate email (Keeping basic validation for potential future use)
    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
    }

    // 🚨 Email subscription logic is currently disabled 🚨
    // Keeping these lines commented out for now.
    
    /*
    // ✅ Check if email already exists in database
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      return NextResponse.json({ message: "Email already subscribed" }, { status: 400 });
    }

    // ✅ Store email in MongoDB
    await prisma.subscriber.create({
      data: { email },
    });
    */

    return NextResponse.json({
      message: "Subscription feature is currently disabled. No data was stored.",
    }, { status: 200 });

  } catch (error) {
    console.error("Error in /api/subscribe:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}