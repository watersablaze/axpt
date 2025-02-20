import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Use the global Prisma instance
import { Prisma } from "@prisma/client"; // ✅ Import Prisma types

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const minAmount = parseFloat(url.searchParams.get("minAmount") || "0");
    const maxAmount = parseFloat(url.searchParams.get("maxAmount") || "1000000");
    const date = url.searchParams.get("date");

    // ✅ Construct the AND array dynamically
    const filters: Prisma.TransactionWhereInput = {
      AND: [],
    };

    if (!isNaN(minAmount) && !isNaN(maxAmount)) {
      (filters.AND as Prisma.TransactionWhereInput[]).push(
        { amount: { gte: minAmount } },
        { amount: { lte: maxAmount } }
      );
    }

    if (type && type !== "all") {
      (filters.AND as Prisma.TransactionWhereInput[]).push({ type: { equals: type } });
    }

    if (date) {
      (filters.AND as Prisma.TransactionWhereInput[]).push({
        createdAt: {
          gte: new Date(date),
          lte: new Date(`${date}T23:59:59`),
        },
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      orderBy: { createdAt: "desc" as Prisma.SortOrder }, // ✅ Corrected orderBy typing
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("❌ Error fetching transactions:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Unknown error fetching transactions" },
      { status: 500 }
    );
  }
}