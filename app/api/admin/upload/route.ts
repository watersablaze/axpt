import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()

  const {
    title,
    fileName,
    fileUrl,
    caseId,
    category
  } = body

  const doc = await prisma.document.create({
    data: {
      title,
      fileName,
      fileUrl,
      caseId,
      category
    }
  })

  return NextResponse.json(doc)
}