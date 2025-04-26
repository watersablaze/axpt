// app/api/partner/serveWhitepaper/route.ts
import { NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";

export async function GET() {
  const filePath = join(process.cwd(), "public", "partner", "Whitepaper_Master.pdf");

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"AXPT_Whitepaper.pdf\""
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load the whitepaper." }, { status: 500 });
  }
}