import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, TransactionTypeEnum } from "@prisma/client"; // ✅ Ensure enum is available

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || undefined;
    const minAmount = parseFloat(url.searchParams.get("minAmount") || "0");
    const maxAmount = parseFloat(url.searchParams.get("maxAmount") || "1000000");
    const date = url.searchParams.get("date");

    const filters: Prisma.TransactionWhereInput = {};

    if (!isNaN(minAmount) && !isNaN(maxAmount)) {
      filters.amount = { gte: minAmount, lte: maxAmount };
    }

    if (type) {
      filters.type = type as TransactionTypeEnum; // ✅ Ensure correct ENUM usage
    }  

    if (date) {
      filters.createdAt = {
        gte: new Date(date),
        lte: new Date(`${date}T23:59:59`),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error: unknown) {
    console.error("❌ Error fetching transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}