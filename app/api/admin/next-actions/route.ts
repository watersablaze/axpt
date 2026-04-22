import { NextResponse } from "next/server"
import { getNextActions } from "@/domains/cases/services/getNextActions"

export async function GET() {

  const actions = await getNextActions()

  return NextResponse.json(actions)

}