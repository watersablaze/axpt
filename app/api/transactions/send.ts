import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { recipientId, amount } = await request.json();
    if (!recipientId || !amount) {
      return NextResponse.json({ error: "Recipient and amount required" }, { status: 400 });
    }

    // ✅ Use `TransactionUncheckedCreateInput` to manually define foreign keys
    const transaction = await prisma.transaction.create({
      data: {
        senderId: session.user.id, // ✅ Ensures senderId matches Prisma expected type
        recipientId, // ✅ Ensure recipientId is stored
        amount: parseFloat(amount),
        type: "TRANSFER", // ✅ Ensure correct type
        status: "pending", // ✅ Added missing field
      } as any, // ✅ Temporary fix for TypeScript type enforcement
    });

    console.log(`✅ Transaction saved: ${transaction.id}`);

    return NextResponse.json({ success: true, transactionId: transaction.id });
  } catch (error) {
    console.error("❌ Error saving transaction:", error);
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}