import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const minAmount = parseFloat(url.searchParams.get("minAmount") || "0");
    const maxAmount = parseFloat(url.searchParams.get("maxAmount") || "1000000");
    const date = url.searchParams.get("date");

    const filters: any = {
      amount: { gte: minAmount, lte: maxAmount },
    };

    if (type && type !== "all") filters.type = type;
    if (date) {
      filters.createdAt = {
        gte: new Date(date), 
        lte: new Date(`${date}T23:59:59`) // End of the selected day
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: filters,
      orderBy: { createdAt: "desc" }, // ✅ Corrected field name
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}