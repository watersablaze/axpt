import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, TransactionStatusEnum, TransactionTypeEnum } from "@prisma/client";
import { ObjectId } from "mongodb"; // ✅ Ensure ObjectId is imported

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ Parse Request Body
    const body = await request.json();
    const { recipientId, amount } = body;

    // ✅ Validate Inputs
    if (!recipientId || !ObjectId.isValid(recipientId)) {
      return NextResponse.json({ error: "Invalid recipient ID" }, { status: 400 });
    }
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // ✅ Convert MongoDB ObjectId to String for Prisma
    const senderIdString = new ObjectId(session.user.id).toString();
    const recipientIdString = new ObjectId(recipientId).toString();

    // ✅ Ensure Recipient Exists
    const recipientExists = await prisma.user.findUnique({
      where: { id: recipientIdString },
    });

    if (!recipientExists) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // ✅ Add `userId` to Transaction Data (Fix the error!)
    const transaction = await prisma.transaction.create({
      data: {
        senderId: senderIdString,
        recipientId: recipientIdString,
        userId: senderIdString, // ✅ Ensure `userId` is included
        amount: parseFloat(amount),
        type: TransactionTypeEnum.TRANSFER, // ✅ Use Prisma Enum
        status: TransactionStatusEnum.PENDING, // ✅ Use Prisma Enum
      } satisfies Prisma.TransactionUncheckedCreateInput, // ✅ Type safety
    });

    console.log(`✅ Transaction saved: ${transaction.id}`);

    return NextResponse.json({ success: true, transactionId: transaction.id });
  } catch (error) {
    console.error("❌ Error saving transaction:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process transaction" },
      { status: 500 }
    );
  }
}